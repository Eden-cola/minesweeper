import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { GraphQLModule } from '@nestjs/graphql';

describe('GraphQL (e2e)', () => {
  it('should load AppModule with GraphQL', async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    const graphqlModule = moduleFixture.get(GraphQLModule);
    expect(graphqlModule).toBeDefined();
  });
});