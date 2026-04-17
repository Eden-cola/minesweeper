import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { MemoryStoreModule } from '../../stores/memory.store';

@Module({
  imports: [MemoryStoreModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}