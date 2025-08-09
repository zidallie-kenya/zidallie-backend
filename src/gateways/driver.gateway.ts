import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayInit,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { LocationService } from '../location/location.service';
import { SocketRoomService } from '../redis/socket-room.service';
import { RedisPubSubService } from '../redis/redis.service';
import { AppConfigService } from '../config/config.service';
import { LocationPayloadDto } from './dto/location.dto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Use configService.cors in production
  },
})
export class DriverGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DriverGateway.name);

  constructor(
    private readonly locationService: LocationService,
    private readonly socketRoomService: SocketRoomService,
    private readonly redisPubSub: RedisPubSubService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('DriverGateway initialized');
    this.logger.log(
      `Socket.IO adapter: ${server.sockets.adapter.constructor.name}`,
    );
    this.logger.log(`CORS origins: ${JSON.stringify(server.engine.opts.cors)}`);

    // Set up periodic connection stats (optional)
    setInterval(() => {
      const connectedSockets = server.sockets.sockets.size;
      this.logger.debug(`Active driver connections: ${connectedSockets}`);
    }, 60000); // Log every minute
  }

  // Handles new driver connections
  async handleConnection(client: Socket) {
    const { token } = client.handshake.query as Record<string, string>;
    console.log('Driver connection attempt with token:', token);
    try {
      if (!token || typeof token !== 'string') {
        client.emit('connectionError', { error: 'Missing or invalid token' });
        return client.disconnect(true);
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.jwt.secret,
      });

      console.log(payload);
      if (payload.kind !== 'Driver') {
        client.emit('connectionError', { error: 'Unauthorized role' });
        return client.disconnect(true);
      }

      // Store decoded payload in socket
      client.data.user = payload;
      client.data.driverId = payload.sub;

      client.emit('connected', { status: 'ok', driverId: payload.sub });
      this.logger.log(`Driver ${payload.sub} connected`);
      console.log('done');
    } catch (err) {
      this.logger.error('Driver connection failed:', err);
      client.emit('connectionError', { error: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const { driverId } = client.data;
    this.logger.log(`Driver ${driverId} disconnected`);
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(@MessageBody() data: LocationPayloadDto) {
    try {
      await this.locationService.handleLocation(data);
      const { driverId, location } = data;

      // Publish to Redis pub/sub for admin panel
      await this.redisPubSub.publishDriverLocationUpdate({
        driverId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
        },
      });

      this.logger.debug(`Location updated for driver ${driverId}`);
    } catch (error) {
      this.logger.error('Location update failed:', error);
      // Don't disconnect driver, just log the error
    }
  }

  @SubscribeMessage('pickup')
  async handlePickupChild(
    @MessageBody() { driverId, childId }: { driverId: string; childId: string },
  ) {
    try {
      const socketId =
        await this.socketRoomService.getParentSocketForChild(childId);
      if (!socketId) {
        this.logger.warn(`No parent socket found for child ${childId}`);
        return;
      }

      const socket = this.server.sockets.sockets.get(socketId);
      if (!socket || socket.disconnected) {
        // Clean up stale Redis entry
        await this.socketRoomService.removeChildToParentMapping(childId);
        this.logger.warn(`Stale socket reference for child ${childId}`);
        return;
      }

      // Add parent to driver room
      await socket.join(`driver:${driverId}`);
      await this.socketRoomService.addParentToDriverRoom(driverId, socketId);

      // Notify parent about pickup
      socket.emit('pickedUp', { driverId, childId, timestamp: Date.now() });

      this.logger.log(`Child ${childId} picked up by driver ${driverId}`);
    } catch (error) {
      this.logger.error(`Pickup failed for child ${childId}:`, error);
    }
  }

  @SubscribeMessage('pickup-all')
  async handlePickupAll(
    @MessageBody() { driverId, rideId }: { driverId: string; rideId: string },
  ) {
    try {
      const parentSocketIds =
        await this.socketRoomService.getAllParentsInRide(rideId);
      let successCount = 0;

      for (const socketId of parentSocketIds) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket && !socket.disconnected) {
          await socket.join(`driver:${driverId}`);
          await this.socketRoomService.addParentToDriverRoom(
            driverId,
            socketId,
          );

          // Notify parent
          socket.emit('pickedUp', {
            driverId,
            rideId,
            timestamp: Date.now(),
            allPickedUp: true,
          });

          successCount++;
        }
      }

      this.logger.log(
        `Picked up ${successCount}/${parentSocketIds.length} parents for ride ${rideId}`,
      );
    } catch (error) {
      this.logger.error(`Pickup-all failed for ride ${rideId}:`, error);
    }
  }

  @SubscribeMessage('dropoff')
  async handleDropoffChild(
    @MessageBody() { driverId, childId }: { driverId: string; childId: string },
  ) {
    try {
      const socketId =
        await this.socketRoomService.getParentSocketForChild(childId);
      if (!socketId) {
        this.logger.warn(`No parent socket found for child ${childId}`);
        return;
      }

      const socket = this.server.sockets.sockets.get(socketId);
      if (socket && !socket.disconnected) {
        await socket.leave(`driver:${driverId}`);
        await this.socketRoomService.removeParentFromDriverRoom(
          driverId,
          socketId,
        );

        // Notify parent about dropoff
        socket.emit('droppedOff', { driverId, childId, timestamp: Date.now() });
      }

      this.logger.log(`Child ${childId} dropped off by driver ${driverId}`);
    } catch (error) {
      this.logger.error(`Dropoff failed for child ${childId}:`, error);
    }
  }

  @SubscribeMessage('dropoff-all')
  async handleDropoffAll(@MessageBody() { driverId }: { driverId: string }) {
    try {
      const socketIds =
        await this.socketRoomService.getAllParentsInDriverRoom(driverId);
      let successCount = 0;

      for (const socketId of socketIds) {
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket && !socket.disconnected) {
          await socket.leave(`driver:${driverId}`);
          // Notify parent
          socket.emit('droppedOff', {
            driverId,
            timestamp: Date.now(),
            allDroppedOff: true,
          });
          successCount++;
        }
      }

      // Clean up driver room
      await this.socketRoomService.cleanupDriverRoom(driverId);

      this.logger.log(
        `Dropped off ${successCount}/${socketIds.length} parents for driver ${driverId}`,
      );
    } catch (error) {
      this.logger.error(`Dropoff-all failed for driver ${driverId}:`, error);
    }
  }
}
