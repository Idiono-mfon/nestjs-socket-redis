import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [EventsModule, ChatModule, RedisModule],
})
export class AppModule {}
