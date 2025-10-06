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

  // School dashboard joins school room
  @SubscribeMessage('joinSchool')
  async handleJoinSchool(client: Socket, schoolId: number) {
    await client.join(`school_${schoolId}`);
    console.log(`✅ School ${schoolId} dashboard joined: ${client.id}`);

    client.emit('schoolJoined', {
      success: true,
      schoolId,
      message: `Connected to school ${schoolId} tracking room`,
    });
  }

  // Admin joins admin room for ALL drivers
  @SubscribeMessage('joinAdmin')
  async handleJoinAdmin(client: Socket) {
    await client.join('admin_room');
    console.log(`✅ Admin client ${client.id} joined admin_room`);

    client.emit('adminJoined', {
      success: true,
      message: 'Connected to admin tracking room',
    });
  }

  @SubscribeMessage('locationUpdate')
  async handleLocationUpdate(client: Socket, payload: any) {
    console.log('📍 Received location update:', payload);

    const driverRoom = `driver_${payload.driverId}`;

    // Ensure driver is in their own room
    await client.join(driverRoom);

    // Log who's in the room
    const socketsInRoom = await this.server.in(driverRoom).fetchSockets();
    console.log(`👥 Clients in ${driverRoom}:`, socketsInRoom.length);

    // Broadcast to specific driver's room (for parents)
    this.server.to(driverRoom).emit('locationBroadcast', payload);

    // Broadcast to admin room (all drivers)
    this.server.to('admin_room').emit('locationBroadcast', payload);

    // Broadcast to ALL school rooms - let clients filter
    this.server.emit('locationBroadcast', payload);

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
