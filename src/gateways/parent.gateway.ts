// gateways/parent.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { SocketRoomService } from '../redis/socket-room.service';
import { AppConfigService } from '../config/config.service';
import { LocationUpdatedEvent } from '../location/location.events';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Use configService.cors in production
  },
})
export class ParentGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ParentGateway.name);

  constructor(
    private readonly socketRoomService: SocketRoomService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ParentGateway initialized');
    this.logger.log(
      `Socket.IO adapter: ${server.sockets.adapter.constructor.name}`,
    );
    this.logger.log(`CORS origins: ${JSON.stringify(server.engine.opts.cors)}`);

    // Set up periodic connection stats (optional)
    setInterval(() => {
      const connectedSockets = server.sockets.sockets.size;
      this.logger.debug(`Active parent connections: ${connectedSockets}`);
    }, 60000); // Log every minute
  }

  // Handles new parent connections
  async handleConnection(client: Socket) {
    const { token, parentId, rideId, childId } = client.handshake
      .query as Record<string, string>;

    try {
      // JWT validation
      if (!token || typeof token !== 'string') {
        client.emit('connectionError', { error: 'Missing or invalid token' });
        return client.disconnect(true);
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.jwt.secret,
      });

      if (payload.kind !== 'Parent') {
        client.emit('connectionError', { error: 'Unauthorized role' });
        return client.disconnect(true);
      }

      // Validate required parameters
      if (!parentId || !rideId || !childId) {
        client.emit('connectionError', {
          error: 'Missing parentId, rideId, or childId',
        });
        return client.disconnect(true);
      }

      // Store user info in socket
      client.data.user = payload;
      client.data.rideId = rideId;
      client.data.childId = childId;
      client.data.parentId = parentId;

      // Use service for Redis operations
      await Promise.all([
        this.socketRoomService.addParentToRide(rideId, client.id),
        this.socketRoomService.mapChildToParentSocket(childId, client.id),
      ]);

      // Join ride room
      await client.join(`ride:${rideId}`);

      client.emit('connected', { status: 'ok', parentId });
      this.logger.log(`Parent ${parentId} connected for ride ${rideId}`);
    } catch (err) {
      this.logger.error('Parent connection failed:', err);
      client.emit('connectionError', { error: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  // This allows parents to receive location updates from the driver
  @OnEvent('location.updated')
  handleLocationUpdated(event: LocationUpdatedEvent) {
    // Emit to parents in the driver room (those who have been picked up)
    this.server.to(`driver:${event.driverId}`).emit('locationUpdate', {
      driverId: event.driverId,
      location: event.location,
      timestamp: Date.now(),
    });
  }

  async handleDisconnect(client: Socket) {
    const { rideId, childId, parentId } = client.data;
    this.logger.log(`Parent ${parentId} disconnecting from ride ${rideId}`);

    try {
      // Clean up using service
      if (rideId) {
        await this.socketRoomService.removeParentFromRide(rideId, client.id);
      }

      if (childId) {
        // Only delete if this socket is still the current one for this child
        const currentSocketId =
          await this.socketRoomService.getParentSocketForChild(childId);
        if (currentSocketId === client.id) {
          await this.socketRoomService.removeChildToParentMapping(childId);
        }
      }

      // Clean up from all possible driver rooms
      await this.socketRoomService.cleanupDisconnectedSocket(client.id);
    } catch (error) {
      this.logger.error('Error during parent disconnect cleanup:', error);
    }
  }

  @SubscribeMessage('debug:getDriverRoom')
  async handleDebugGetDriverRoom(
    @MessageBody() { driverId }: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const sockets = await this.server.fetchSockets();
      const driverRoom = `driver:${driverId}`;
      const matchingSockets = sockets.filter((socket) =>
        socket.rooms.has(driverRoom),
      );

      const socketIds = matchingSockets.map((s) => s.id);

      client.emit('debug:driverRoomList', {
        driverId,
        parents: socketIds,
      });
    } catch (error) {
      this.logger.error('Debug get driver room failed:', error);
      client.emit('debug:error', { error: 'Failed to get driver room info' });
    }
  }
}
