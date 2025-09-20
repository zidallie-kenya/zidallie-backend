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

    // Ensure driver is in their own room
    await client.join(driverRoom);

    // Broadcast location only to this driver's room
    this.server.to(driverRoom).emit('locationBroadcast', payload);

    // Throttle saving to DB (per driver)
    const now = Date.now();
    console.log(now);
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
