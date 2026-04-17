import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule (e2e)', () => {
  it('should compile AppModule without errors', async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();
  });
});