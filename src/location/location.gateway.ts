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
import { ValidationPipe, UsePipes } from '@nestjs/common';
import { LocationUpdatePayloadDto } from './dto/location-update-payload.dto';

@WebSocketGateway({ cors: true })
export class LocationGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private lastSaved: Record<string, number> = {};

    constructor(private readonly locationsService: LocationsService) { }

    afterInit(server: Server) {
        console.log('Socket server initialized');
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRide')
    handleJoinRide(client: Socket, rideId: number) {
        client.join(`ride_${rideId}`);
        console.log(`Client ${client.id} joined ride_${rideId}`);
    }

    @SubscribeMessage('locationUpdate')
    async handleLocationUpdate(client: Socket, payload: any) {

        console.log('Received location payload:', payload);

        // Broadcast: if there's a ride, send to ride room; otherwise, just emit globally
        if (payload.dailyRideId) {
            this.server.to(`ride_${payload.dailyRideId}`).emit('locationBroadcast', payload);
        } else {
            this.server.emit('locationBroadcast', payload);
        }

        // Throttle saving: unique per driver, not per ride
        const now = Date.now();
        const last = this.lastSaved[payload.driverId] || 0;

        if (now - last >= 2 * 60 * 1000) { // 2 minutes
            this.lastSaved[payload.driverId] = now;

            try {
                await this.locationsService.create({
                    driverId: payload.driverId,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    timestamp: payload.timestamp,
                    dailyRideId: payload.dailyRideId
                });
            } catch (err) {
                console.error('Failed to save location:', err);
                client.emit('error', { message: 'Failed to save location' });
            }
        }
    }

}
