import { Global, Module } from '@nestjs/common';
import { RedisProvider } from './redis.prodiver';
import { RedisPubSubService } from './redis.service';
import { SocketRoomService } from './socket-room.service';
import { AppConfigModule } from '../config/appconfig.module';

@Global()
@Module({
  imports: [AppConfigModule],
  exports: [RedisProvider, RedisPubSubService, SocketRoomService],
  providers: [RedisProvider, RedisPubSubService, SocketRoomService],
})
export class RedisModule {}
