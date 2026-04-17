import { Module } from '@nestjs/common';
import { GameResolver, PlayerResolver } from './game.resolver';
import { GameService } from './game.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [GameResolver, PlayerResolver, GameService],
  exports: [GameService],
})
export class GameModule {}
