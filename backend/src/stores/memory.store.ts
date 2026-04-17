import { Injectable, Global } from '@nestjs/common';

export interface UserData {
  id: string;
  name: string;
  score: number;
  createdAt: Date;
}

export interface CellData {
  id: string;
  row: number;
  col: number;
  isRevealed: boolean;
  isMine: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  gameId: string;
}

export interface PlayerData {
  id: string;
  userId: string;
  score: number;
  joinedAt: Date;
  gameId: string;
}

export interface GameData {
  id: string;
  rows: number;
  cols: number;
  mines: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Global()
@Injectable()
export class MemoryStore {
  private users = new Map<string, UserData>();
  private games = new Map<string, GameData>();
  private cells = new Map<string, CellData>();
  private players = new Map<string, PlayerData>();
  private playerByUserAndGame = new Map<string, string>(); // `${userId}-${gameId}` -> playerId

  // User operations
  getUser(id: string): UserData | undefined {
    return this.users.get(id);
  }

  createUser(id: string, name: string): UserData {
    const user: UserData = {
      id,
      name,
      score: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  updateUserScore(id: string, scoreChange: number): UserData | undefined {
    const user = this.users.get(id);
    if (user) {
      user.score += scoreChange;
    }
    return user;
  }

  // Game operations
  getGame(id: string): GameData | undefined {
    return this.games.get(id);
  }

  createGame(rows: number, cols: number, mines: number): GameData {
    const id = this.generateId();
    const game: GameData = {
      id,
      rows,
      cols,
      mines,
      status: 'WAITING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  updateGameStatus(id: string, status: string): GameData | undefined {
    const game = this.games.get(id);
    if (game) {
      game.status = status;
      game.updatedAt = new Date();
    }
    return game;
  }

  getGamesByUserId(userId: string): GameData[] {
    const playerIds = this.getPlayerIdsByUserId(userId);
    return playerIds
      .map((pid) => this.players.get(pid))
      .filter((p): p is PlayerData => p !== undefined)
      .map((p) => this.games.get(p.gameId))
      .filter((g): g is GameData => g !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Cell operations
  createCells(cells: Omit<CellData, 'id'>[]): void {
    for (const cell of cells) {
      const id = this.generateId();
      this.cells.set(id, { ...cell, id });
    }
  }

  getCellsByGameId(gameId: string): CellData[] {
    return Array.from(this.cells.values()).filter((c) => c.gameId === gameId);
  }

  updateCell(id: string, updates: Partial<CellData>): CellData | undefined {
    const cell = this.cells.get(id);
    if (cell) {
      Object.assign(cell, updates);
    }
    return cell;
  }

  // Player operations
  getPlayer(id: string): PlayerData | undefined {
    return this.players.get(id);
  }

  getPlayerByUserAndGame(userId: string, gameId: string): PlayerData | undefined {
    const playerId = this.playerByUserAndGame.get(`${userId}-${gameId}`);
    if (playerId) {
      return this.players.get(playerId);
    }
    return undefined;
  }

  createPlayer(userId: string, gameId: string): PlayerData {
    const id = this.generateId();
    const player: PlayerData = {
      id,
      userId,
      gameId,
      score: 0,
      joinedAt: new Date(),
    };
    this.players.set(id, player);
    this.playerByUserAndGame.set(`${userId}-${gameId}`, id);
    return player;
  }

  updatePlayerScore(id: string, scoreChange: number): PlayerData | undefined {
    const player = this.players.get(id);
    if (player) {
      player.score += scoreChange;
    }
    return player;
  }

  private getPlayerIdsByUserId(userId: string): string[] {
    return Array.from(this.players.values())
      .filter((p) => p.userId === userId)
      .map((p) => p.id);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}