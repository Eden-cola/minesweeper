export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Cell = {
  __typename?: 'Cell';
  adjacentMines: Scalars['Int']['output'];
  col: Scalars['Int']['output'];
  isFlagged: Scalars['Boolean']['output'];
  isMine: Scalars['Boolean']['output'];
  isRevealed: Scalars['Boolean']['output'];
  row: Scalars['Int']['output'];
};

export type CellRevealEvent = {
  __typename?: 'CellRevealEvent';
  cell: Cell;
  gameId: Scalars['ID']['output'];
  revealedBy: Player;
  scoreChange: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type CreateGameInput = {
  cols: Scalars['Int']['input'];
  mines: Scalars['Int']['input'];
  rows: Scalars['Int']['input'];
};

export type Game = {
  __typename?: 'Game';
  cells: Array<Array<Cell>>;
  cols: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mines: Scalars['Int']['output'];
  players: Array<Player>;
  remainingCells: Scalars['Int']['output'];
  rows: Scalars['Int']['output'];
  scoreChange: Scalars['Int']['output'];
  status: GameStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type GameStateUpdate = {
  __typename?: 'GameStateUpdate';
  game: Game;
  gameId: Scalars['ID']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export enum GameStatus {
  Abandoned = 'ABANDONED',
  Completed = 'COMPLETED',
  Playing = 'PLAYING',
  Waiting = 'WAITING'
}

export type Mutation = {
  __typename?: 'Mutation';
  createGame: Game;
  revealCell: RevealCellResult;
  toggleFlag: Game;
};


export type MutationCreateGameArgs = {
  input: CreateGameInput;
};


export type MutationRevealCellArgs = {
  input: RevealCellInput;
};


export type MutationToggleFlagArgs = {
  input: ToggleFlagInput;
};

export type Player = {
  __typename?: 'Player';
  id: Scalars['ID']['output'];
  joinedAt: Scalars['DateTime']['output'];
  score: Scalars['Int']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export enum PlayerAction {
  Joined = 'JOINED',
  Left = 'LEFT'
}

export type PlayerUpdate = {
  __typename?: 'PlayerUpdate';
  action: PlayerAction;
  gameId: Scalars['ID']['output'];
  player: Player;
};

export type Query = {
  __typename?: 'Query';
  game?: Maybe<Game>;
  me: User;
  myGames: Array<Game>;
  myScore: Scalars['Int']['output'];
};


export type QueryGameArgs = {
  id: Scalars['ID']['input'];
};

export type RevealCellInput = {
  col: Scalars['Int']['input'];
  gameId: Scalars['ID']['input'];
  row: Scalars['Int']['input'];
};

export type RevealCellResult = {
  __typename?: 'RevealCellResult';
  cell: Cell;
  game: Game;
  scoreChange: Scalars['Int']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  cellRevealed: CellRevealEvent;
  gameStateUpdated: GameStateUpdate;
  playerUpdated: PlayerUpdate;
};


export type SubscriptionCellRevealedArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionGameStateUpdatedArgs = {
  gameId: Scalars['ID']['input'];
};


export type SubscriptionPlayerUpdatedArgs = {
  gameId: Scalars['ID']['input'];
};

export type ToggleFlagInput = {
  col: Scalars['Int']['input'];
  gameId: Scalars['ID']['input'];
  row: Scalars['Int']['input'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  score: Scalars['Int']['output'];
};

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, name: string, score: number, createdAt: any } };

export type GetMyScoreQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyScoreQuery = { __typename?: 'Query', myScore: number };

export type GetGameQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetGameQuery = { __typename?: 'Query', game?: { __typename?: 'Game', id: string, status: GameStatus, rows: number, cols: number, mines: number, scoreChange: number, remainingCells: number, createdAt: any, updatedAt: any, cells: Array<Array<{ __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }>>, players: Array<{ __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } }> } | null };

export type GetMyGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyGamesQuery = { __typename?: 'Query', myGames: Array<{ __typename?: 'Game', id: string, status: GameStatus, rows: number, cols: number, mines: number, scoreChange: number, remainingCells: number, createdAt: any, updatedAt: any }> };

export type CreateGameMutationVariables = Exact<{
  input: CreateGameInput;
}>;


export type CreateGameMutation = { __typename?: 'Mutation', createGame: { __typename?: 'Game', id: string, status: GameStatus, rows: number, cols: number, mines: number, scoreChange: number, remainingCells: number, createdAt: any, updatedAt: any, cells: Array<Array<{ __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }>>, players: Array<{ __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } }> } };

export type RevealCellMutationVariables = Exact<{
  input: RevealCellInput;
}>;


export type RevealCellMutation = { __typename?: 'Mutation', revealCell: { __typename?: 'RevealCellResult', scoreChange: number, cell: { __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }, game: { __typename?: 'Game', id: string, status: GameStatus, scoreChange: number, remainingCells: number, cells: Array<Array<{ __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }>> } } };

export type ToggleFlagMutationVariables = Exact<{
  input: ToggleFlagInput;
}>;


export type ToggleFlagMutation = { __typename?: 'Mutation', toggleFlag: { __typename?: 'Game', id: string, status: GameStatus, rows: number, cols: number, mines: number, scoreChange: number, remainingCells: number, createdAt: any, updatedAt: any, cells: Array<Array<{ __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }>>, players: Array<{ __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } }> } };

export type GameStateUpdatedSubscriptionVariables = Exact<{
  gameId: Scalars['ID']['input'];
}>;


export type GameStateUpdatedSubscription = { __typename?: 'Subscription', gameStateUpdated: { __typename?: 'GameStateUpdate', gameId: string, timestamp: any, game: { __typename?: 'Game', id: string, status: GameStatus, scoreChange: number, remainingCells: number, cells: Array<Array<{ __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }>>, players: Array<{ __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } }> } } };

export type CellRevealedSubscriptionVariables = Exact<{
  gameId: Scalars['ID']['input'];
}>;


export type CellRevealedSubscription = { __typename?: 'Subscription', cellRevealed: { __typename?: 'CellRevealEvent', gameId: string, scoreChange: number, timestamp: any, cell: { __typename?: 'Cell', row: number, col: number, isRevealed: boolean, isMine: boolean, isFlagged: boolean, adjacentMines: number }, revealedBy: { __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } } } };

export type PlayerUpdatedSubscriptionVariables = Exact<{
  gameId: Scalars['ID']['input'];
}>;


export type PlayerUpdatedSubscription = { __typename?: 'Subscription', playerUpdated: { __typename?: 'PlayerUpdate', gameId: string, action: PlayerAction, player: { __typename?: 'Player', id: string, userId: string, score: number, joinedAt: any, user: { __typename?: 'User', id: string, name: string, score: number } } } };
