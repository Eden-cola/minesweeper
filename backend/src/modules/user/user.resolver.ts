import { Resolver, Query, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './models/user.model';

function getCurrentUserId(): string {
  return process.env.USER_ID || 'default-user';
}

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => User)
  async me(): Promise<User> {
    const userId = getCurrentUserId();
    return this.userService.findOrCreate(userId, `User-${userId.slice(0, 6)}`);
  }

  @Query(() => Int)
  async myScore(): Promise<number> {
    const userId = getCurrentUserId();
    return this.userService.getScore(userId);
  }
}
