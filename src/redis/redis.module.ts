import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { RedisPubSubService } from './redis-pubsub.service';

@Module({
  exports: [RedisProvider, RedisPubSubService],
  providers: [RedisProvider, RedisPubSubService],
})
export class RedisModule {}
