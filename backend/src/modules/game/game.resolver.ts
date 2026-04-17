import { Resolver, Query, Mutation, Subscription, Args, ID, InputType, Field, Int } from '@nestjs/graphql';
import { GameService } from './game.service';
import { Game, Cell, GameStateUpdate, CellRevealEvent, PlayerUpdate, RevealCellResult } from './models/game.model';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '../../pubsub.module';
import { PubSub } from 'graphql-subscriptions';
import { UserService } from '../user/user.service';

function getCurrentUserId(): string {
  return process.env.USER_ID || 'default-user';
}

@InputType()
export class CreateGameInput {
  @Field(() => Int)
  rows: number;

  @Field(() => Int)
  cols: number;

  @Field(() => Int)
  mines: number;
}

@InputType()
export class RevealCellInput {
  @Field(() => ID)
  gameId: string;

  @Field(() => Int)
  row: number;

  @Field(() => Int)
  col: number;
}

@InputType()
export class ToggleFlagInput {
  @Field(() => ID)
  gameId: string;

  @Field(() => Int)
  row: number;

  @Field(() => Int)
  col: number;
}

@Resolver(() => Game)
export class GameResolver {
  constructor(
    private gameService: GameService,
    private userService: UserService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

  @Query(() => Game, { nullable: true })
  async game(@Args('id', { type: () => ID }) id: string): Promise<Game | null> {
    return this.gameService.getGame(id) as unknown as Promise<Game | null>;
  }

  @Query(() => [Game])
  async myGames(): Promise<Game[]> {
    const userId = getCurrentUserId();
    return this.gameService.getUserGames(userId) as unknown as Promise<Game[]>;
  }

  @Mutation(() => Game)
  async createGame(
    @Args('input', { type: () => CreateGameInput }) input: CreateGameInput,
  ): Promise<Game> {
    const userId = getCurrentUserId();
    await this.userService.findOrCreate(userId, `User-${userId.slice(0, 6)}`);
    return this.gameService.createGame(userId, input.rows, input.cols, input.mines) as unknown as Promise<Game>;
  }

  @Mutation(() => RevealCellResult)
  async revealCell(
    @Args('input', { type: () => RevealCellInput }) input: RevealCellInput,
  ): Promise<RevealCellResult> {
    const userId = getCurrentUserId();
    const result = await this.gameService.revealCell(userId, input.gameId, input.row, input.col);
    return {
      cell: result.cell as Cell,
      scoreChange: result.scoreChange,
      game: result.game as unknown as Game,
    };
  }

  @Mutation(() => Game)
  async toggleFlag(
    @Args('input', { type: () => ToggleFlagInput }) input: ToggleFlagInput,
  ): Promise<Game> {
    const userId = getCurrentUserId();
    return this.gameService.toggleFlag(userId, input.gameId, input.row, input.col) as unknown as Promise<Game>;
  }

  @Subscription(() => GameStateUpdate, {
    filter: (payload, variables) => {
      return payload.gameStateUpdated.gameId === variables.gameId;
    },
  })
  gameStateUpdated() {
    return this.pubSub.asyncIterator('gameStateUpdated');
  }

  @Subscription(() => CellRevealEvent, {
    filter: (payload, variables) => {
      return payload.cellRevealed.gameId === variables.gameId;
    },
  })
  cellRevealed() {
    return this.pubSub.asyncIterator('cellRevealed');
  }

  @Subscription(() => PlayerUpdate, {
    filter: (payload, variables) => {
      return payload.playerUpdated.gameId === variables.gameId;
    },
  })
  playerUpdated() {
    return this.pubSub.asyncIterator('playerUpdated');
  }
}
