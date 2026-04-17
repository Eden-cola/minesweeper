import { Client, fetchExchange, subscriptionExchange } from '@urql/core';
import { createClient as createWSClient } from 'graphql-ws';

const GRAPHQL_HTTP_URL = 'http://localhost:4000/graphql';
const GRAPHQL_WS_URL = 'ws://localhost:4000/graphql';

const wsClient = createWSClient({
  url: GRAPHQL_WS_URL,
});

export const urqlClient = new Client({
  url: GRAPHQL_HTTP_URL,
  exchanges: [
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation as any, sink as any),
        }),
      }),
    }),
  ],
});

export { wsClient };
