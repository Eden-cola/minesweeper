import { Module } from '@nestjs/common';
import { GameResolver, PlayerResolver } from './game.resolver';
import { GameService } from './game.service';
import { UserModule } from '../user/user.module';
import { MemoryStoreModule } from '../../stores/memory.store';

@Module({
  imports: [UserModule, MemoryStoreModule],
  providers: [GameResolver, PlayerResolver, GameService],
  exports: [GameService],
})
export class GameModule {}
