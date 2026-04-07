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
  private readonly SAVE_THROTTLE_MS = 30 * 1000; // 30 seconds
  private readonly ACTIVE_RIDE_THROTTLE_MS = 5 * 1000; // active ride: 5s

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
  async handleJoinDriver(client: Socket, driverId: any) {
    const id = Number(driverId); //force number

    await client.join(`driver_${id}`);
    console.log(`Client ${client.id} joined driver_${id}`);
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
    const driverId = Number(payload.driverId);
    const dailyRideId = payload.dailyRideId
      ? Number(payload.dailyRideId)
      : undefined;

    payload.driverId = driverId;

    console.log('📍 Received location update:', payload);

    const driverRoom = `driver_${driverId}`;
    await client.join(driverRoom);

    const socketsInRoom = await this.server.in(driverRoom).fetchSockets();
    console.log(`👥 Clients in ${driverRoom}:`, socketsInRoom.length);

    this.server.to(driverRoom).emit('locationBroadcast', payload);
    this.server.to('admin_room').emit('locationBroadcast', payload);
    this.server.emit('locationBroadcast', payload);

    const now = Date.now();
    const last = this.lastSaved[driverId] || 0;

    const throttle = dailyRideId
      ? this.ACTIVE_RIDE_THROTTLE_MS
      : this.SAVE_THROTTLE_MS;

    if (now - last >= throttle) {
      this.lastSaved[driverId] = now;

      if (!dailyRideId) {
        console.log(
          `⏭️ No dailyRideId, skipping DB save for driver ${driverId}`,
        );
        return;
      }

      try {
        await this.locationsService.create({
          driverId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: payload.timestamp,
          dailyRideId,
        });
        console.log(`✅ Location saved to DB for driver ${driverId}`);
      } catch (error) {
        console.error(
          `❌ Failed to save location for driver ${driverId}:`,
          error,
        );
      }
    } else {
      const timeSinceLast = Math.round((now - last) / 1000);
      console.log(
        `⏭️  Skipping DB save for driver ${driverId} (last saved ${timeSinceLast}s ago)`,
      );
    }
  }
}
