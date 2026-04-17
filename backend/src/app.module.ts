import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PubSubModule } from './pubsub.module';
import { PrismaModule } from './prisma.module';
import { UserModule } from './modules/user/user.module';
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      context: ({ req, connection }: { req?: unknown; connection?: unknown }) => {
        if (connection) {
          return { req: (connection as { context: unknown }).context };
        }
        return { req };
      },
    }),
    PubSubModule,
    PrismaModule,
    UserModule,
    GameModule,
  ],
})
export class AppModule {}
