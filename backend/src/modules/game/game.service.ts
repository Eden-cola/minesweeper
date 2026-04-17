import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '../../pubsub.module';
import { PubSub } from 'graphql-subscriptions';
import { MemoryStore, GameData, CellData, PlayerData } from '../../stores/memory.store';
import { UserService } from '../user/user.service';

export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface CellDataOutput {
  row: number;
  col: number;
  isRevealed: boolean;
  isMine: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface GameWithCells extends GameData {
  cells: CellDataOutput[][];
}

@Injectable()
export class GameService {
  constructor(
    @Inject(PUB_SUB) private pubSub: PubSub,
    private store: MemoryStore,
    private userService: UserService,
  ) {}

  // Generate minesweeper board with mines placed
  private generateBoard(
    rows: number,
    cols: number,
    mineCount: number,
  ): { isMine: boolean; adjacentMines: number }[][] {
    // Initialize empty board
    const board: { isMine: boolean; adjacentMines: number }[][] = Array(
      rows,
    )
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ isMine: false, adjacentMines: 0 })),
      );

    // Place mines randomly
    let placedMines = 0;
    while (placedMines < mineCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!board[r][c].isMine) {
        board[r][c].isMine = true;
        placedMines++;
      }
    }

    // Calculate adjacent mines for each cell
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              board[nr][nc].isMine
            ) {
              count++;
            }
          }
          board[r][c].adjacentMines = count;
        }
      }
    }

    return board;
  }

  // Convert database cells to 2D array format
  private cellsTo2DArray(cells: CellData[], rows: number, cols: number): CellDataOutput[][] {
    const grid: CellDataOutput[][] = Array(rows)
      .fill(null)
      .map((_, r) =>
        Array(cols)
          .fill(null)
          .map((__, c) => ({
            row: r,
            col: c,
            isRevealed: false,
            isMine: false,
            isFlagged: false,
            adjacentMines: 0,
          })),
      );

    for (const cell of cells) {
      grid[cell.row][cell.col] = {
        row: cell.row,
        col: cell.col,
        isRevealed: cell.isRevealed,
        isMine: cell.isMine,
        isFlagged: cell.isFlagged,
        adjacentMines: cell.adjacentMines,
      };
    }

    return grid;
  }

  // Get game with cells formatted as 2D array
  private getGameWithCells(
    gameId: string,
  ): { game: GameData; cells: CellDataOutput[][] } | null {
    const game = this.store.getGame(gameId);
    if (!game) return null;

    const cells = this.store.getCellsByGameId(gameId);
    return { game, cells: this.cellsTo2DArray(cells, game.rows, game.cols) };
  }

  async createGame(
    userId: string,
    rows: number,
    cols: number,
    mines: number,
  ): Promise<GameWithCells> {
    // Generate board data
    const board = this.generateBoard(rows, cols, mines);

    // Create game
    const game = this.store.createGame(rows, cols, mines);

    // Create all cells
    const cellData: Omit<CellData, 'id'>[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cellData.push({
          row: r,
          col: c,
          isMine: board[r][c].isMine,
          adjacentMines: board[r][c].adjacentMines,
          isRevealed: false,
          isFlagged: false,
          gameId: game.id,
        });
      }
    }
    this.store.createCells(cellData);

    // Create player association
    this.store.createPlayer(userId, game.id);

    // Get full game result
    const result = this.getGameWithCells(game.id);

    // Publish game state update
    this.pubSub.publish('gameStateUpdated', {
      gameStateUpdated: {
        gameId: game.id,
        game: this.formatGame(result!),
        timestamp: new Date(),
      },
    });

    return this.formatGame(result!);
  }

  // Format game for GraphQL response
  private formatGame(result: { game: GameData; cells: CellDataOutput[][] }): GameWithCells {
    return {
      ...result.game,
      cells: result.cells,
    } as unknown as GameWithCells;
  }

  // Find or create player for user in game
  private findOrCreatePlayer(userId: string, gameId: string): PlayerData {
    let player = this.store.getPlayerByUserAndGame(userId, gameId);
    if (!player) {
      player = this.store.createPlayer(userId, gameId);
    }
    return player;
  }

  // Reveal a cell and handle cascading
  async revealCell(
    userId: string,
    gameId: string,
    row: number,
    col: number,
  ): Promise<{
    cell: CellDataOutput;
    scoreChange: number;
    game: GameWithCells;
  }> {
    // Get game and verify it exists
    const game = this.store.getGame(gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== GameStatus.WAITING && game.status !== GameStatus.PLAYING) {
      throw new Error('Game is not in progress');
    }

    // Find or create player
    const player = this.findOrCreatePlayer(userId, gameId);

    // Get cells for this game
    const allCells = this.store.getCellsByGameId(gameId);
    const cell = allCells.find((c) => c.row === row && c.col === col);
    if (!cell) throw new Error('Cell not found');
    if (cell.isRevealed) throw new Error('Cell already revealed');

    let scoreChange = 0;
    const revealedCells: CellData[] = [];

    // Handle mine hit
    if (cell.isMine) {
      scoreChange = -10;
      this.store.updateCell(cell.id, { isRevealed: true });
      revealedCells.push({ ...cell, isRevealed: true });

      // Update game status to ABANDONED
      this.store.updateGameStatus(gameId, GameStatus.ABANDONED);
    } else {
      // Update game to PLAYING if it was WAITING
      if (game.status === GameStatus.WAITING) {
        this.store.updateGameStatus(gameId, GameStatus.PLAYING);
      }

      // BFS/flood-fill to reveal empty cells
      const cellsToReveal: { row: number; col: number }[] = [{ row, col }];
      const visited = new Set<string>();
      visited.add(`${row},${col}`);

      while (cellsToReveal.length > 0) {
        const { row: r, col: c } = cellsToReveal.shift()!;
        const currentCell = allCells.find(
          (cell) => cell.row === r && cell.col === c,
        );

        if (!currentCell || currentCell.isRevealed || currentCell.isMine) {
          continue;
        }

        // Reveal this cell
        this.store.updateCell(currentCell.id, { isRevealed: true });
        revealedCells.push({ ...currentCell, isRevealed: true });
        scoreChange += 1; // +1 for each revealed empty cell

        // If it's an empty cell (no adjacent mines), add neighbors
        if (currentCell.adjacentMines === 0) {
          const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
          ];
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            const key = `${nr},${nc}`;
            if (
              !visited.has(key) &&
              nr >= 0 &&
              nr < game.rows &&
              nc >= 0 &&
              nc < game.cols
            ) {
              visited.add(key);
              cellsToReveal.push({ row: nr, col: nc });
            }
          }
        }
      }

      // Check win condition - all non-mine cells revealed
      const totalNonMineCells = game.rows * game.cols - game.mines;
      const revealedNonMineCells = revealedCells.filter(
        (c) => !c.isMine,
      ).length;
      const existingRevealed = allCells.filter(
        (c) => c.isRevealed && !c.isMine,
      ).length;

      if (existingRevealed + revealedNonMineCells >= totalNonMineCells) {
        this.store.updateGameStatus(gameId, GameStatus.COMPLETED);
      }
    }

    // Update player score
    if (scoreChange !== 0) {
      this.store.updatePlayerScore(player.id, scoreChange);
      this.userService.updateScore(userId, scoreChange);
    }

    // Get updated game state
    const gameResult = this.getGameWithCells(gameId);
    if (!gameResult) throw new Error('Game not found after update');

    // Publish cell revealed events
    for (const revealedCell of revealedCells) {
      this.pubSub.publish('cellRevealed', {
        cellRevealed: {
          gameId,
          cell: {
            row: revealedCell.row,
            col: revealedCell.col,
            isRevealed: true,
            isMine: revealedCell.isMine,
            isFlagged: revealedCell.isFlagged,
            adjacentMines: revealedCell.adjacentMines,
          },
          revealedBy: {
            id: player.id,
            userId: player.userId,
            score: player.score + scoreChange,
            joinedAt: player.joinedAt,
          },
          scoreChange: scoreChange,
          timestamp: new Date(),
        },
      });
    }

    // Publish game state update
    this.pubSub.publish('gameStateUpdated', {
      gameStateUpdated: {
        gameId,
        game: this.formatGame(gameResult),
        timestamp: new Date(),
      },
    });

    return {
      cell: {
        row: cell.row,
        col: cell.col,
        isRevealed: true,
        isMine: cell.isMine,
        isFlagged: cell.isFlagged,
        adjacentMines: cell.adjacentMines,
      },
      scoreChange,
      game: this.formatGame(gameResult),
    };
  }

  // Toggle flag on a cell
  async toggleFlag(
    userId: string,
    gameId: string,
    row: number,
    col: number,
  ): Promise<GameWithCells> {
    // Get game
    const currentGame = this.store.getGame(gameId);
    if (!currentGame) throw new Error('Game not found');
    if (currentGame.status === GameStatus.COMPLETED || currentGame.status === GameStatus.ABANDONED) {
      throw new Error('Game has ended');
    }

    // Find or create player
    this.findOrCreatePlayer(userId, gameId);

    // Find the cell
    const allCells = this.store.getCellsByGameId(gameId);
    const cell = allCells.find((c) => c.row === row && c.col === col);
    if (!cell) throw new Error('Cell not found');
    if (cell.isRevealed) throw new Error('Cannot flag a revealed cell');

    // Toggle flag
    this.store.updateCell(cell.id, { isFlagged: !cell.isFlagged });

    // Get updated game state
    const result = this.getGameWithCells(gameId);
    if (!result) throw new Error('Game not found');

    // Publish game state update
    this.pubSub.publish('gameStateUpdated', {
      gameStateUpdated: {
        gameId,
        game: this.formatGame(result),
        timestamp: new Date(),
      },
    });

    return this.formatGame(result);
  }

  async getGame(gameId: string): Promise<GameWithCells | null> {
    const result = this.getGameWithCells(gameId);
    if (!result) return null;
    return this.formatGame(result);
  }

  async getUserGames(userId: string): Promise<GameWithCells[]> {
    const games = this.store.getGamesByUserId(userId);
    return games.map((game) => {
      const cells = this.store.getCellsByGameId(game.id);
      return this.formatGame({
        game,
        cells: this.cellsTo2DArray(cells, game.rows, game.cols),
      });
    });
  }
}