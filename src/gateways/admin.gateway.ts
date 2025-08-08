import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { LocationDto } from './dto/location.dto';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { OnEvent } from '@nestjs/event-emitter';
import { LocationUpdatedEvent } from '../location/location.events';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  afterInit(server: Server) {
    this.redisPubSub.setSocketServer(server);
  }

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  //on connect: joins admin:panel room
  async handleConnection(client: Socket) {
    const { adminId } = client.handshake.query as Record<string, string>;

    if (adminId) {
      await client.join('admin:panel');
    }
  }

  //Listens to location.updated events and emits to ride:{rideId} room
  @OnEvent('location.updated')
  handleLocationUpdated(event: LocationUpdatedEvent) {
    this.emitToAdminPanel(event.rideId, event.driverId, event.location);
  }

  //Removes disconnected socket from all ride:*:sockets sets
  async handleDisconnect(client: Socket) {
    const keys = await this.redis.smembers('allRideSocketSets');
    for (const key of keys) {
      await this.redis.srem(key, client.id);
    }
  }

  //admins joins using: socket.join('admin:panel')
  emitToAdminPanel(rideId: string, driverId: string, location: LocationDto) {
    this.server
      .to('admin:panel')
      .emit('locationUpdate', { rideId, driverId, location });
  }
}
