import { Injectable } from '@nestjs/common';
import { MemoryStore, UserData } from '../../stores/memory.store';

@Injectable()
export class UserService {
  constructor(private store: MemoryStore) {}

  findById(id: string): UserData | null {
    return this.store.getUser(id) ?? null;
  }

  findOrCreate(id: string, name: string): UserData {
    const existing = this.store.getUser(id);
    if (existing) {
      return existing;
    }
    return this.store.createUser(id, name);
  }

  updateScore(userId: string, scoreChange: number): UserData {
    const user = this.store.updateUserScore(userId, scoreChange);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  getScore(userId: string): number {
    const user = this.store.getUser(userId);
    return user?.score ?? 0;
  }
}