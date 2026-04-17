import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreate(id: string, name: string): Promise<User> {
    let user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { id, name },
      });
    }
    return user;
  }

  async updateScore(userId: string, scoreChange: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        score: {
          increment: scoreChange,
        },
      },
    });
  }

  async getScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { score: true },
    });
    return user?.score ?? 0;
  }
}
