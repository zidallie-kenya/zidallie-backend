// gateways/admin.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisPubSubService } from '../redis/redis.service';
import { LocationUpdatedEvent } from '../location/location.events';
import { LocationDto } from './dto/location.dto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Use configService.cors in production
  },
})
export class AdminGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  afterInit(server: Server) {
    this.redisPubSub.setSocketServer(server);
    this.logger.log('AdminGateway initialized');
  }

  // Handles admin connections
  async handleConnection(client: Socket) {
    const { adminId } = client.handshake.query as Record<string, string>;

    if (adminId) {
      await client.join('admin:panel');
      client.emit('connected', { status: 'ok', adminId });
      this.logger.log(`Admin ${adminId} connected`);
    } else {
      client.emit('connectionError', { error: 'Missing adminId' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Admin disconnected', client.id);
    // No cleanup needed for admin connections
  }

  @OnEvent('location.updated')
  handleLocationUpdated(event: LocationUpdatedEvent) {
    this.emitToAdminPanel(event.rideId, event.driverId, event.location);
  }

  private emitToAdminPanel(
    rideId: string,
    driverId: string,
    location: LocationDto,
  ) {
    this.server.to('admin:panel').emit('locationUpdate', {
      rideId,
      driverId,
      location,
      timestamp: Date.now(),
    });
  }
}
