# Prev Code

```ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationsService } from './location.service';

@WebSocketGateway({ cors: true })
export class LocationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private lastSaved: Record<string, number> = {};

  constructor(private readonly locationsService: LocationsService) {}

  afterInit(server: Server) {
    console.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client (e.g. parent app) joins a driver's room to get live updates
  @SubscribeMessage('joinDriver')
  async handleJoinDriver(client: Socket, driverId: number) {
    await client.join(`driver_${driverId}`);
    console.log(`Client ${client.id} joined driver_${driverId}`);
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(client: Socket, payload: any) {
    const driverRoom = `driver_${payload.driverId}`;
    console.log(driverRoom);

    // Ensure driver is in their own room
    await client.join(driverRoom);

    console.log(payload);
    // Broadcast location only to this driver's room
    this.server.to(driverRoom).emit('locationBroadcast', payload);

    // Throttle saving to DB (per driver)
    const now = Date.now();
    const last = this.lastSaved[payload.driverId] || 0;

    if (now - last >= 2 * 60 * 1000) {
      this.lastSaved[payload.driverId] = now;

      try {
        await this.locationsService.create({
          driverId: payload.driverId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
        });
      } catch (err) {
        console.error('Failed to save location:', err);
        client.emit('error', { message: 'Failed to save location' });
      }
    }
  }
}
```

```ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationsService } from './location.service';

@WebSocketGateway({ cors: true })
export class LocationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private lastSaved: Record<string, number> = {};

  constructor(private readonly locationsService: LocationsService) {}

  afterInit(server: Server) {
    console.log('Socket server initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client (e.g. parent app) joins a driver's room to get live updates
  @SubscribeMessage('joinDriver')
  async handleJoinDriver(client: Socket, driverId: number) {
    const driver_id = Number(driverId);

    if (Number.isNaN(driver_id)) {
      client.emit('error', { message: 'Invalid driverId for joinDriver' });
      return;
    }

    const driverRoom = `driver_${driver_id}`;

    // join only if not already in room
    if (!client.rooms.has(driverRoom)) {
      await client.join(driverRoom);
      console.log(`Client ${client.id} joined ${driverRoom}`);
    }

    // optional ack
    client.emit('joinedDriver', { driverId });
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(client: Socket, payload: any) {
    // normalize driverId as number
    const driverId = Number(payload.driverId);

    if (Number.isNaN(driverId)) {
      console.warn('Received locationUpdate with invalid driverId', payload);
      client.emit('error', { message: 'Invalid driverId' });
      return;
    }

    const driverRoom = `driver_${driverId}`;
    console.log(driverRoom);

    // only join if the client isn't already in the room
    if (!client.rooms.has(driverRoom)) {
      await client.join(driverRoom);
    }

    console.log(payload);

    // Broadcast location only to this driver's room
    this.server.to(driverRoom).emit('locationBroadcast', payload);

    // Throttle saving to DB (per driver)
    const now = Date.now();
    const last = this.lastSaved[payload.driverId] || 0;

    if (now - last >= 2 * 60 * 1000) {
      this.lastSaved[String(driverId)] = now;

      try {
        await this.locationsService.create({
          driverId: payload.driverId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
        });
      } catch (err) {
        console.error('Failed to save location:', err);
        client.emit('error', { message: 'Failed to save location' });
      }
    }
  }
}
```
