import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '../../pubsub.module';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '../../prisma.service';
import { UserService } from '../user/user.service';
import { Cell, Game } from '@prisma/client';

export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface CellData {
  row: number;
  col: number;
  isRevealed: boolean;
  isMine: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface GameWithCells extends Game {
  cells: Cell[][];
}

@Injectable()
export class GameService {
  constructor(
    @Inject(PUB_SUB) private pubSub: PubSub,
    private prisma: PrismaService,
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
  private cellsTo2DArray(cells: Cell[], rows: number, cols: number): Cell[][] {
    const grid: Cell[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null) as Cell[]);

    for (const cell of cells) {
      grid[cell.row][cell.col] = cell;
    }

    return grid;
  }

  // Get game with cells formatted as 2D array
  async getGameWithCells(
    gameId: string,
  ): Promise<{ game: Game; cells: Cell[][] } | null> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { cells: true },
    });

    if (!game) return null;

    const cells = this.cellsTo2DArray(game.cells, game.rows, game.cols);
    return { game, cells };
  }

  async createGame(
    userId: string,
    rows: number,
    cols: number,
    mines: number,
  ): Promise<GameWithCells> {
    // Generate board data
    const board = this.generateBoard(rows, cols, mines);

    // Create game with cells in a transaction
    const game = await this.prisma.$transaction(async (tx) => {
      // Create game
      const newGame = await tx.game.create({
        data: {
          rows,
          cols,
          mines,
          status: GameStatus.WAITING,
        },
      });

      // Create all cells
      const cellData = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cellData.push({
            row: r,
            col: c,
            isMine: board[r][c].isMine,
            adjacentMines: board[r][c].adjacentMines,
            gameId: newGame.id,
          });
        }
      }
      await tx.cell.createMany({ data: cellData });

      // Create player association
      await tx.player.create({
        data: {
          userId,
          gameId: newGame.id,
        },
      });

      return newGame;
    });

    // Fetch full game with cells
    const result = await this.getGameWithCells(game.id);

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
  private formatGame(result: { game: Game; cells: Cell[][] }): GameWithCells {
    return {
      ...result.game,
      cells: result.cells.map((row) =>
        row.map((cell) => ({
          row: cell.row,
          col: cell.col,
          isRevealed: cell.isRevealed,
          isMine: cell.isMine,
          isFlagged: cell.isFlagged,
          adjacentMines: cell.adjacentMines,
        })),
      ),
    } as unknown as GameWithCells;
  }

  // Reveal a cell and handle cascading
  async revealCell(
    userId: string,
    gameId: string,
    row: number,
    col: number,
  ): Promise<{
    cell: CellData;
    scoreChange: number;
    game: GameWithCells;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Get game and verify it exists
      const game = await tx.game.findUnique({
        where: { id: gameId },
        include: { cells: true },
      });

      if (!game) throw new Error('Game not found');
      if (game.status !== GameStatus.WAITING && game.status !== GameStatus.PLAYING) {
        throw new Error('Game is not in progress');
      }

      // Find or create player
      let player = await tx.player.findFirst({
        where: { userId, gameId },
      });

      if (!player) {
        player = await tx.player.create({
          data: { userId, gameId },
        });
      }

      // Find the cell
      const cell = game.cells.find((c) => c.row === row && c.col === col);
      if (!cell) throw new Error('Cell not found');
      if (cell.isRevealed) throw new Error('Cell already revealed');

      let scoreChange = 0;
      const revealedCells: Cell[] = [];

      // Handle mine hit
      if (cell.isMine) {
        scoreChange = -10;
        await tx.cell.update({
          where: { id: cell.id },
          data: { isRevealed: true },
        });
        revealedCells.push({ ...cell, isRevealed: true });

        // Update game status to ABANDONED
        await tx.game.update({
          where: { id: gameId },
          data: { status: GameStatus.ABANDONED },
        });
      } else {
        // Update game to PLAYING if it was WAITING
        if (game.status === GameStatus.WAITING) {
          await tx.game.update({
            where: { id: gameId },
            data: { status: GameStatus.PLAYING },
          });
        }

        // BFS/flood-fill to reveal empty cells
        const cellsToReveal: { row: number; col: number }[] = [{ row, col }];
        const visited = new Set<string>();
        visited.add(`${row},${col}`);

        while (cellsToReveal.length > 0) {
          const { row: r, col: c } = cellsToReveal.shift()!;
          const currentCell = game.cells.find(
            (cell) => cell.row === r && cell.col === c,
          );

          if (!currentCell || currentCell.isRevealed || currentCell.isMine) {
            continue;
          }

          // Reveal this cell
          await tx.cell.update({
            where: { id: currentCell.id },
            data: { isRevealed: true },
          });
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
        const existingRevealed = game.cells.filter(
          (c) => c.isRevealed && !c.isMine,
        ).length;

        if (existingRevealed + revealedNonMineCells >= totalNonMineCells) {
          await tx.game.update({
            where: { id: gameId },
            data: { status: GameStatus.COMPLETED },
          });
        }
      }

      // Update player score
      if (scoreChange !== 0) {
        await tx.player.update({
          where: { id: player.id },
          data: { score: { increment: scoreChange } },
        });
        await this.userService.updateScore(userId, scoreChange);
      }

      return {
        cell,
        revealedCells,
        scoreChange,
        game,
        player,
      };
    });

    // Get updated game state
    const gameResult = await this.getGameWithCells(gameId);

    // Publish cell revealed events
    for (const cell of result.revealedCells) {
      this.pubSub.publish('cellRevealed', {
        cellRevealed: {
          gameId,
          cell: {
            row: cell.row,
            col: cell.col,
            isRevealed: true,
            isMine: cell.isMine,
            isFlagged: cell.isFlagged,
            adjacentMines: cell.adjacentMines,
          },
          revealedBy: {
            id: result.player.id,
            userId: result.player.userId,
            score: result.player.score + result.scoreChange,
            joinedAt: result.player.joinedAt,
          },
          scoreChange: result.scoreChange,
          timestamp: new Date(),
        },
      });
    }

    // Publish game state update
    this.pubSub.publish('gameStateUpdated', {
      gameStateUpdated: {
        gameId,
        game: this.formatGame(gameResult!),
        timestamp: new Date(),
      },
    });

    return {
      cell: {
        row: result.cell.row,
        col: result.cell.col,
        isRevealed: true,
        isMine: result.cell.isMine,
        isFlagged: result.cell.isFlagged,
        adjacentMines: result.cell.adjacentMines,
      },
      scoreChange: result.scoreChange,
      game: this.formatGame(gameResult!),
    };
  }

  // Toggle flag on a cell
  async toggleFlag(
    userId: string,
    gameId: string,
    row: number,
    col: number,
  ): Promise<GameWithCells> {
    await this.prisma.$transaction(async (tx) => {
      // Get game
      const currentGame = await tx.game.findUnique({
        where: { id: gameId },
        include: { cells: true },
      });

      if (!currentGame) throw new Error('Game not found');
      if (currentGame.status === GameStatus.COMPLETED || currentGame.status === GameStatus.ABANDONED) {
        throw new Error('Game has ended');
      }

      // Find or create player
      let player = await tx.player.findFirst({
        where: { userId, gameId },
      });

      if (!player) {
        player = await tx.player.create({
          data: { userId, gameId },
        });
      }

      // Find the cell
      const cell = currentGame.cells.find((c) => c.row === row && c.col === col);
      if (!cell) throw new Error('Cell not found');
      if (cell.isRevealed) throw new Error('Cannot flag a revealed cell');

      // Toggle flag
      await tx.cell.update({
        where: { id: cell.id },
        data: { isFlagged: !cell.isFlagged },
      });

      return currentGame;
    });

    // Get updated game state
    const result = await this.getGameWithCells(gameId);

    // Publish game state update
    this.pubSub.publish('gameStateUpdated', {
      gameStateUpdated: {
        gameId,
        game: this.formatGame(result!),
        timestamp: new Date(),
      },
    });

    return this.formatGame(result!);
  }

  async getGame(gameId: string): Promise<GameWithCells | null> {
    const result = await this.getGameWithCells(gameId);
    if (!result) return null;
    return this.formatGame(result);
  }

  async getUserGames(userId: string): Promise<GameWithCells[]> {
    const players = await this.prisma.player.findMany({
      where: { userId },
      include: { game: { include: { cells: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    return players.map(({ game }) => this.formatGame({ game, cells: this.cellsTo2DArray(game.cells, game.rows, game.cols) }));
  }
}
