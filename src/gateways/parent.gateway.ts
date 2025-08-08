import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { OnEvent } from '@nestjs/event-emitter';
import { LocationUpdatedEvent } from '../location/location.events';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ParentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  //joins ride room => maps child->socketId => tracks socket ids
  async handleConnection(client: Socket) {
    const { token, parentId, rideId, childId } = client.handshake
      .query as Record<string, string>;

    // 🔐 Step 1: Validate the JWT
    if (!token || typeof token !== 'string') {
      client.emit('connectionError', { error: 'Missing or invalid token' });
      return client.disconnect(true);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-fallback-secret',
      });

      // 🔐 Optional: Check if user is actually a parent
      if (payload.kind !== 'Parent') {
        client.emit('connectionError', { error: 'Unauthorized role' });
        return client.disconnect(true);
      }

      // Store user info in socket
      client.data.user = payload;
    } catch (err) {
      client.emit('connectionError', { error: 'Invalid or expired token' });
      console.log(err);
      return client.disconnect(true);
    }

    // ✅ Step 2: Continue with connection logic
    if (parentId && rideId && childId) {
      //stores all the parent ids associated with a ride(all parents in a certain ride)
      // SMEMBERS 'ride:202:sockets'
      await this.redis.sadd(`ride:${rideId}:sockets`, client.id);
      //stores the parent_socket_id : GET 'child:500:parentSocket'
      await this.redis.set(`child:${childId}:parentSocket`, client.id);

      // Track metadata on the socket
      client.data.rideId = rideId;
      client.data.childId = childId;

      //adds parent to a romm ride:rideId
      await client.join(`ride:${rideId}`);

      // ✅ Emit confirmation to the parent client
      client.emit('connected', { status: 'ok', parentId });
    } else {
      // Reject connection
      client.emit('connectionError', {
        error: 'Missing parentId, rideId, or childId',
      });
      client.disconnect(true);
    }
  }

  //Listens for location.updated via @OnEvent ✅
  //Broadcasts to all parents in driver:{driverId} room ✅
  @OnEvent('location.updated')
  handleLocationUpdated(event: LocationUpdatedEvent) {
    this.server.to(`driver:${event.driverId}`).emit('locationUpdate', {
      driverId: event.driverId,
      location: event.location,
    });
  }

  //Cleans up all socket entries from Redis keys ✅
  async handleDisconnect(client: Socket) {
    const { rideId, childId } = client.data;

    if (rideId) {
      await this.redis.srem(`ride:${rideId}:sockets`, client.id);
    }

    if (childId) {
      const val = await this.redis.get(`child:${childId}:parentSocket`);
      if (val === client.id) {
        await this.redis.del(`child:${childId}:parentSocket`);
      }
    }

    // Remove from any driver room sets (if applicable)
    const driverRoomKeys = await this.redis.smembers('allDriverRooms'); // you can maintain this manually
    for (const roomKey of driverRoomKeys) {
      await this.redis.srem(roomKey, client.id);
    }
  }

  //emits current parent socket IDs in a driver’s room=> admin
  @SubscribeMessage('debug:getDriverRoom')
  async handleDebugGetDriverRoom(
    @MessageBody() { driverId }: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
  }
}
