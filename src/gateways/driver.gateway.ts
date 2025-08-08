import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { LocationService } from '../location/location.service';
import { LocationPayloadDto } from '../location/dto/location.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { RedisPubSubService } from '../redis/redis-pubsub.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DriverGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly locationService: LocationService,
    private readonly redisPubSub: RedisPubSubService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ✅ Authenticated connection
  async handleConnection(client: Socket) {
    const { token } = client.handshake.query as Record<string, string>;

    if (!token || typeof token !== 'string') {
      client.emit('connectionError', { error: 'Missing or invalid token' });
      return client.disconnect(true);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret',
      });

      // Optionally enforce role
      if (payload.kind !== 'Driver') {
        client.emit('connectionError', { error: 'Unauthorized role' });
        return client.disconnect(true);
      }

      // Store decoded payload in socket for later use
      client.data.user = payload;
      client.emit('connected', { status: 'ok', driverId: payload.sub });
    } catch (err) {
      console.error(err);
      client.emit('connectionError', { error: 'Invalid or expired token' });
      return client.disconnect(true);
    }
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(@MessageBody() data: LocationPayloadDto) {
    await this.locationService.handleLocation(data);

    const { driverId, location } = data;

    await this.redisPubSub.publishDriverLocationUpdate({
      driverId: driverId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
      },
    });
  }

  // pickup a single child → add that child's parent to driver room
  @SubscribeMessage('pickup')
  async handlePickupChild(
    @MessageBody() { driverId, childId }: { driverId: string; childId: string },
  ) {
    //this is set when the parent first connected in ParentGateway.handleConnection
    try {
      const socketId = await this.redis.get(`child:${childId}:parentSocket`);
      if (socketId) {
        //Using the socket id, we fetch the live socket connection from the Socket.IO server.
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          //Add the parent to the driver's room
          await socket.join(`driver:${driverId}`);
          await this.redis.sadd(`driver:${driverId}:sockets`, socketId);
          await this.redis.sadd('allDriverRooms', `driver:${driverId}:sockets`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  // pickup all → add all parents of the ride to driver room
  @SubscribeMessage('pickup-all')
  async handlePickupAll(
    @MessageBody() { driverId, rideId }: { driverId: string; rideId: string },
  ) {
    const parentSocketIds = await this.redis.smembers(`ride:${rideId}:sockets`);
    for (const socketId of parentSocketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await socket.join(`driver:${driverId}`);
        await this.redis.sadd(`driver:${driverId}:sockets`, socketId);
      }
    }
  }

  // drop one child → remove parent from driver room
  @SubscribeMessage('dropoff')
  async handleDropoffChild(
    @MessageBody() { driverId, childId }: { driverId: string; childId: string },
  ) {
    const socketId = await this.redis.get(`child:${childId}:parentSocket`);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await socket.leave(`driver:${driverId}`);
        await this.redis.srem(`driver:${driverId}:sockets`, socketId);
      }
    }
  }

  // drop all → remove all parents from driver room
  @SubscribeMessage('dropoff-all')
  async handleDropoffAll(@MessageBody() { driverId }: { driverId: string }) {
    const socketIds = await this.redis.smembers(`driver:${driverId}:sockets`);
    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await socket.leave(`driver:${driverId}`);
      }
    }
    // ✅ Delete the driver room socket set
    await this.redis.del(`driver:${driverId}:sockets`);

    // ✅ Also remove the set from the known driver room list
    await this.redis.srem('allDriverRooms', `driver:${driverId}:sockets`);
  }
}
