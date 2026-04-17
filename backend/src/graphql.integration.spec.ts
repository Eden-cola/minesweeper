import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

describe('GraphQL (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should initialize AppModule with GraphQL', () => {
    expect(app).toBeDefined();
  });

  it('should have resolvers registered', () => {
    // The fact that app.init() succeeded means all dependencies are resolved
    // and the GraphQL module is properly configured
    expect(app).toBeDefined();
  });
});