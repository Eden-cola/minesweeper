import { Module } from '@nestjs/common';
import { GameResolver } from './game.resolver';
import { GameService } from './game.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [GameResolver, GameService],
  exports: [GameService],
})
export class GameModule {}
