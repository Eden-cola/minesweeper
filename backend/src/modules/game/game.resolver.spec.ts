import { Test, TestingModule } from '@nestjs/testing';
import { GameResolver, CreateGameInput, RevealCellInput, ToggleFlagInput } from './game.resolver';
import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { PUB_SUB } from '../../pubsub.module';

const mockGame = {
  id: 'game-1',
  status: 'WAITING',
  rows: 9,
  cols: 9,
  mines: 10,
  cells: Array(9).fill(null).map((_, row) =>
    Array(9).fill(null).map((__, col) => ({
      row,
      col,
      isRevealed: false,
      isMine: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  ),
  scoreChange: 0,
  remainingCells: 81,
  players: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCell = {
  row: 0,
  col: 0,
  isRevealed: true,
  isMine: false,
  isFlagged: false,
  adjacentMines: 0,
};

describe('GameResolver', () => {
  let resolver: GameResolver;
  let gameService: jest.Mocked<GameService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockGameService = {
      getGame: jest.fn(),
      getUserGames: jest.fn(),
      createGame: jest.fn(),
      revealCell: jest.fn(),
      toggleFlag: jest.fn(),
    };

    const mockUserService = {
      findById: jest.fn(),
      findOrCreate: jest.fn(),
      updateScore: jest.fn(),
      getScore: jest.fn(),
    };

    const mockPubSub = {
      asyncIterator: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: jest.fn().mockReturnValue({
          next: jest.fn(),
        }),
      }),
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameResolver,
        { provide: GameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: PUB_SUB, useValue: mockPubSub },
      ],
    }).compile();

    resolver = module.get<GameResolver>(GameResolver);
    gameService = module.get(GameService);
    userService = module.get(UserService);
  });

  describe('Query: game', () => {
    it('should return a game by id', async () => {
      gameService.getGame.mockResolvedValue(mockGame as any);

      const result = await resolver.game('game-1');

      expect(result).toEqual(mockGame);
      expect(gameService.getGame).toHaveBeenCalledWith('game-1');
    });

    it('should return null if game not found', async () => {
      gameService.getGame.mockResolvedValue(null);

      const result = await resolver.game('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('Query: myGames', () => {
    it('should return games for current user', async () => {
      const mockGames = [mockGame];
      gameService.getUserGames.mockResolvedValue([mockGame] as any);

      const result = await resolver.myGames();

      expect(result).toEqual(mockGames);
      expect(gameService.getUserGames).toHaveBeenCalled();
    });

    it('should return empty array if user has no games', async () => {
      gameService.getUserGames.mockResolvedValue([]);

      const result = await resolver.myGames();

      expect(result).toEqual([]);
    });
  });

  describe('Mutation: createGame', () => {
    it('should create a new game', async () => {
      const input: CreateGameInput = { rows: 9, cols: 9, mines: 10 };
      gameService.createGame.mockResolvedValue(mockGame as any);
      (userService.findOrCreate as jest.Mock).mockResolvedValue({ id: 'user-1', name: 'TestUser', score: 0, createdAt: new Date() });

      const result = await resolver.createGame(input);

      expect(result).toEqual(mockGame);
      expect(gameService.createGame).toHaveBeenCalledWith(expect.any(String), 9, 9, 10);
      expect(userService.findOrCreate).toHaveBeenCalled();
    });
  });

  describe('Mutation: revealCell', () => {
    it('should reveal a cell and return result', async () => {
      const input: RevealCellInput = { gameId: 'game-1', row: 0, col: 0 };
      const revealResult = {
        cell: { ...mockCell, isRevealed: true },
        scoreChange: 1,
        game: { ...mockGame, cells: [[{ ...mockCell, isRevealed: true }], ...Array(8).fill(null).map(() => Array(9).fill(null).map(() => ({ row: 0, col: 0, isRevealed: false, isMine: false, isFlagged: false, adjacentMines: 0 })))] },
      };
      gameService.revealCell.mockResolvedValue(revealResult as any);

      const result = await resolver.revealCell(input);

      expect(result.cell).toBeDefined();
      expect(result.scoreChange).toBe(1);
      expect(gameService.revealCell).toHaveBeenCalledWith(expect.any(String), 'game-1', 0, 0);
    });
  });

  describe('Mutation: toggleFlag', () => {
    it('should toggle flag on a cell', async () => {
      const input: ToggleFlagInput = { gameId: 'game-1', row: 0, col: 0 };
      const toggledGame = {
        ...mockGame,
        cells: [[{ ...mockCell, isFlagged: true }], ...Array(8).fill(null).map(() => Array(9).fill(null).map(() => ({ row: 0, col: 0, isRevealed: false, isMine: false, isFlagged: false, adjacentMines: 0 })))],
      };
      gameService.toggleFlag.mockResolvedValue(toggledGame as any);

      await resolver.toggleFlag(input);

      expect(gameService.toggleFlag).toHaveBeenCalledWith(expect.any(String), 'game-1', 0, 0);
    });
  });
});
