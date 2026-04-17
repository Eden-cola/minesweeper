import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { UserData } from '../../stores/memory.store';

const mockUser: UserData = {
  id: 'user-1',
  name: 'TestUser',
  score: 100,
  createdAt: new Date(),
};

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserService = {
      findById: jest.fn(),
      findOrCreate: jest.fn(),
      updateScore: jest.fn(),
      getScore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get(UserService);
  });

  describe('Query: me', () => {
    it('should return current user', async () => {
      (userService.findOrCreate as jest.Mock).mockResolvedValue(mockUser);

      const result = await resolver.me();

      expect(result).toEqual(mockUser);
      expect(userService.findOrCreate).toHaveBeenCalled();
    });

    it('should create user if not exists', async () => {
      (userService.findOrCreate as jest.Mock).mockResolvedValue(mockUser);

      await resolver.me();

      expect(userService.findOrCreate).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    });
  });

  describe('Query: myScore', () => {
    it('should return current user score', async () => {
      (userService.getScore as jest.Mock).mockResolvedValue(100);

      const result = await resolver.myScore();

      expect(result).toBe(100);
      expect(userService.getScore).toHaveBeenCalled();
    });

    it('should return 0 if user has no score', async () => {
      (userService.getScore as jest.Mock).mockResolvedValue(0);

      const result = await resolver.myScore();

      expect(result).toBe(0);
    });
  });
});