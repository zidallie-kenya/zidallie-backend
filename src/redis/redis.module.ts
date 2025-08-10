// src/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisPubSubService } from './redis.service';
import { SocketRoomService } from './socket-room.service';
import { AppConfigModule } from '../config/appconfig.module';
import { RedisProvider } from './redis.prodiver';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [RedisProvider, RedisPubSubService, SocketRoomService],
  exports: [RedisProvider, RedisPubSubService, SocketRoomService],
})
export class RedisModule {}
