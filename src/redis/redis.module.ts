import { Module } from '@nestjs/common';
import { RedisIoAdapter } from '../redis/adapters/redis-io.adapter';
import { RedistoreService } from './redistore/redistore.service';

@Module({
  providers: [RedisIoAdapter, RedistoreService],
  exports: [RedistoreService, RedisIoAdapter],
})
export class RedisModule {}
