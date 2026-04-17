import { useState, useEffect, useCallback } from 'react';
import { Client, fetchExchange, OperationResult } from '@urql/core';
import { createClient as createWSClient } from 'graphql-ws';
import type {
  CreateGameMutation,
  CreateGameMutationVariables,
  RevealCellMutation,
  RevealCellMutationVariables,
  GetGameQuery,
  GetGameQueryVariables,
  GameStateUpdatedSubscription,
  GameStateUpdatedSubscriptionVariables,
  CellRevealedSubscription,
  CellRevealedSubscriptionVariables,
} from '../gql/generated';

// GraphQL endpoint configuration
const GRAPHQL_HTTP_URL = 'http://localhost:4000/graphql';
const GRAPHQL_WS_URL = 'ws://localhost:4000/graphql';

interface UseMutationOptions<TData, _TVariables> {
  onCompleted?: (data: TData) => void;
  onError?: (error: Error) => void;
}

interface UseQueryOptions<TData, _TVariables> {
  skip?: boolean;
  onCompleted?: (data: TData) => void;
}

interface UseSubscriptionOptions<TData, _TVariables> {
  onData?: (data: TData) => void;
  onError?: (error: Error) => void;
}

// Create a singleton client
let httpClient: Client | null = null;
let wsClient: ReturnType<typeof createWSClient> | null = null;

function getHttpClient(): Client {
  if (!httpClient) {
    httpClient = new Client({
      url: GRAPHQL_HTTP_URL,
      exchanges: [fetchExchange],
    });
  }
  return httpClient;
}

function getWsClient() {
  if (!wsClient) {
    wsClient = createWSClient({
      url: GRAPHQL_WS_URL,
    });
  }
  return wsClient;
}

// useQuery hook
export function useQuery<TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: UseQueryOptions<TData, TVariables>
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.skip) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function executeQuery() {
      setLoading(true);
      setError(null);

      try {
        const client = getHttpClient();
        const result = await client.query(query, variables as any).toPromise();

        if (!cancelled) {
          if (result.error) {
            setError(new Error(result.error.message));
          } else {
            setData(result.data as TData);
            options?.onCompleted?.(result.data as TData);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    executeQuery();

    return () => {
      cancelled = true;
    };
  }, [query, JSON.stringify(variables), options?.skip]);

  return { data, loading, error };
}

// useMutation hook
export function useMutation<TData, TVariables>(
  mutation: string,
  options?: UseMutationOptions<TData, TVariables>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (variables?: TVariables) => {
      setLoading(true);
      setError(null);

      try {
        const client = getHttpClient();
        const result = await client.mutation(mutation, variables as any).toPromise();

        if (result.error) {
          throw new Error(result.error.message);
        }

        options?.onCompleted?.(result.data as TData);
        return result.data as TData;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Unknown error');
        setError(err);
        options?.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutation]
  );

  return { execute, loading, error };
}

// useSubscription hook
export function useSubscription<TData, TVariables>(
  subscription: string,
  variables?: TVariables,
  options?: UseSubscriptionOptions<TData, TVariables>
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = getWsClient();

    const unsubscribe = client.subscribe(
      { query: subscription, variables: variables as any },
      {
        next: (result: OperationResult) => {
          if (result.error) {
            setError(new Error(result.error.message));
          } else if (result.data) {
            setData(result.data as TData);
            options?.onData?.(result.data as TData);
          }
        },
        error: (err: Error) => {
          setError(err);
          options?.onError?.(err);
        },
        complete: () => {
          setConnected(false);
        },
      }
    );

    setConnected(true);

    return () => {
      unsubscribe();
    };
  }, [subscription, JSON.stringify(variables)]);

  return { data, error, connected };
}

// Specific game hooks
export function useCreateGame() {
  const mutation = `
    mutation CreateGame($input: CreateGameInput!) {
      createGame(input: $input) {
        id
        status
        rows
        cols
        mines
        cells {
          row
          col
          isRevealed
          isMine
          isFlagged
          adjacentMines
        }
        scoreChange
        remainingCells
        players {
          id
          userId
          user {
            id
            name
            score
          }
          score
          joinedAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  return useMutation<CreateGameMutation['createGame'], CreateGameMutationVariables>(mutation);
}

export function useRevealCell() {
  const mutation = `
    mutation RevealCell($input: RevealCellInput!) {
      revealCell(input: $input) {
        cell {
          row
          col
          isRevealed
          isMine
          isFlagged
          adjacentMines
        }
        scoreChange
        game {
          id
          status
          scoreChange
          remainingCells
          cells {
            row
            col
            isRevealed
            isMine
            isFlagged
            adjacentMines
          }
        }
      }
    }
  `;

  return useMutation<RevealCellMutation['revealCell'], RevealCellMutationVariables>(mutation);
}

export function useGetGame(gameId: string | null) {
  const query = `
    query GetGame($id: ID!) {
      game(id: $id) {
        id
        status
        rows
        cols
        mines
        cells {
          row
          col
          isRevealed
          isMine
          isFlagged
          adjacentMines
        }
        scoreChange
        remainingCells
        players {
          id
          userId
          user {
            id
            name
            score
          }
          score
          joinedAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  return useQuery<GetGameQuery['game'], GetGameQueryVariables>(
    query,
    { id: gameId ?? '' },
    { skip: !gameId }
  );
}

export function useGameStateSubscription(gameId: string | null) {
  const subscription = `
    subscription GameStateUpdated($gameId: ID!) {
      gameStateUpdated(gameId: $gameId) {
        gameId
        game {
          id
          status
          scoreChange
          remainingCells
          cells {
            row
            col
            isRevealed
            isMine
            isFlagged
            adjacentMines
          }
          players {
            id
            userId
            user {
              id
              name
              score
            }
            score
            joinedAt
          }
        }
        timestamp
      }
    }
  `;

  return useSubscription<GameStateUpdatedSubscription['gameStateUpdated'], GameStateUpdatedSubscriptionVariables>(
    subscription,
    { gameId: gameId ?? '' }
  );
}

export function useCellRevealedSubscription(gameId: string | null) {
  const subscription = `
    subscription CellRevealed($gameId: ID!) {
      cellRevealed(gameId: $gameId) {
        gameId
        cell {
          row
          col
          isRevealed
          isMine
          isFlagged
          adjacentMines
        }
        revealedBy {
          id
          userId
          user {
            id
            name
            score
          }
          score
          joinedAt
        }
        scoreChange
        timestamp
      }
    }
  `;

  return useSubscription<CellRevealedSubscription['cellRevealed'], CellRevealedSubscriptionVariables>(
    subscription,
    { gameId: gameId ?? '' }
  );
}
