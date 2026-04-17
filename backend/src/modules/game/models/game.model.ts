import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Cell {
  @Field(() => Int)
  row: number;

  @Field(() => Int)
  col: number;

  @Field()
  isRevealed: boolean;

  @Field()
  isMine: boolean;

  @Field()
  isFlagged: boolean;

  @Field(() => Int)
  adjacentMines: number;
}

@ObjectType()
export class Player {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  score: number;

  @Field()
  joinedAt: Date;
}

@ObjectType()
export class Game {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  status: string;

  @Field(() => Int)
  rows: number;

  @Field(() => Int)
  cols: number;

  @Field(() => Int)
  mines: number;

  @Field(() => [[Cell]])
  cells: Cell[][];

  @Field(() => Int)
  scoreChange: number;

  @Field(() => Int)
  remainingCells: number;

  @Field(() => [Player])
  players: Player[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class RevealCellResult {
  @Field(() => Cell)
  cell: Cell;

  @Field(() => Int)
  scoreChange: number;

  @Field(() => Game)
  game: Game;
}

@ObjectType()
export class GameStateUpdate {
  @Field(() => ID)
  gameId: string;

  @Field(() => Game)
  game: Game;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class CellRevealEvent {
  @Field(() => ID)
  gameId: string;

  @Field(() => Cell)
  cell: Cell;

  @Field(() => Player)
  revealedBy: Player;

  @Field(() => Int)
  scoreChange: number;

  @Field()
  timestamp: Date;
}

@ObjectType()
export class PlayerUpdate {
  @Field(() => ID)
  gameId: string;

  @Field(() => Player)
  player: Player;

  @Field(() => String)
  action: string;
}
