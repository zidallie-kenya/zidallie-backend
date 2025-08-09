//This service listens to Redis Pub/Sub messages and forwards them to WebSocket clients.
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit {
  private subscriber: Redis;
  private _server: any;
  private readonly logger = new Logger(RedisPubSubService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleInit() {
    try {
      this.subscriber = this.redis.duplicate();

      // Subscribe to driver location updates
      await this.subscriber.subscribe('location:driver');
      this.logger.log('Subscribed to location:driver channel');

      this.subscriber.on('message', (channel, message) => {
        try {
          if (channel === 'location:driver') {
            const data = JSON.parse(message);
            this.emitToAdminPanel(data);
          }
        } catch (error) {
          this.logger.error('Error processing Redis message:', error);
        }
      });
    } catch (err) {
      this.logger.error('Failed to initialize Redis subscriber:', err);
    }
  }

  setSocketServer(server: any) {
    this._server = server;
  }

  private emitToAdminPanel(data: {
    rideId: string;
    driverId: string;
    location: any;
  }) {
    if (!this._server) {
      this.logger.warn('Socket server not initialized');
      return;
    }

    this._server.to('admin:panel').emit('locationUpdate', {
      rideId: data.rideId,
      driverId: data.driverId,
      location: data.location,
      timestamp: Date.now(),
    });
  }

  // Publishes driver location to Redis Pub/Sub
  async publishDriverLocationUpdate(data: {
    driverId: string;
    location: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    rideId?: string; // Optional, but useful for admin context
  }): Promise<void> {
    try {
      const payload = {
        driverId: data.driverId,
        location: data.location,
        rideId: data.rideId ?? 'unknown',
      };

      await this.redis.publish('location:driver', JSON.stringify(payload));
      this.logger.debug(
        `Published location update for driver ${data.driverId} to Redis`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish location update for driver ${data.driverId}:`,
        error,
      );
    }
  }
}
