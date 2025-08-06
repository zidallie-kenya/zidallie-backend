// redis-pubsub.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit {
  private subscriber: Redis;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleInit() {
    this.subscriber = this.redis.duplicate();

    // Subscribe to driver location updates
    await this.subscriber.subscribe('location:driver');

    this.subscriber.on('message', (channel, message) => {
      if (channel === 'location:driver') {
        const data = JSON.parse(message);

        // You need access to socket.io server to broadcast
        this.emitToAdminPanel(data);
      }
    });
  }

  // This will be injected later with the Gateway's server
  private _server: any;

  setSocketServer(server: any) {
    this._server = server;
  }

  emitToAdminPanel(data: {
    driverId: string;
    location: { latitude: number; longitude: number; timestamp: number };
  }) {
    if (this._server) {
      this._server.to('admin:panel').emit('driver:location', {
        driverId: data.driverId,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          timestamp: data.location.timestamp,
        },
      });
    }
  }

  // Used by driver gateway to publish location
  async publishDriverLocationUpdate(payload: any) {
    await this.redis.publish('location:driver', JSON.stringify(payload));
  }
}
