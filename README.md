# Location Code

Services:

```ts
/*
The service processes location updates from drivers, stores them efficiently, and enables real-time tracking while preventing system abuse through rate limiting.
*/

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
// import { EventEmitter2 } from '@nestjs/event-emitter';
import { LocationEntity } from './infrastructure/persistence/relational/entities/location.entity';
import { LocationPayloadDto } from '../gateways/dto/location.dto';
// import { LocationUpdatedEvent } from './location.events';

const RATE_LIMITS = {
  LOCATION_UPDATE_MS: 1000, // 1 second
} as const;

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private lastLocationUpdate = new Map<string, number>();

  constructor(
    // @InjectRedis() private readonly redis: Redis,
    @InjectRepository(LocationEntity)
    private readonly locationRepo: Repository<LocationEntity>,
    // private readonly eventEmitter: EventEmitter2,
  ) {}

  // Validate latitude and longitude to ensure they are within valid ranges
  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  //a driver should not be able to update their location more than once per second
  private shouldRateLimit(driverId: string): boolean {
    const now = Date.now();
    const lastUpdate = this.lastLocationUpdate.get(driverId) || 0;

    if (now - lastUpdate < RATE_LIMITS.LOCATION_UPDATE_MS) {
      return true;
    }

    this.lastLocationUpdate.set(driverId, now);
    return false;
  }

  // Handles incoming location updates from drivers
  // Validates the data, applies rate limiting, and saves it to Redis and PostgreSQL
  // Emits an event for real-time updates
  async handleLocation(data: LocationPayloadDto): Promise<void> {
    this.logger.log(`Processing location update for driver ${data.driverId}`);

    try {
      // Validate input
      const { driverId, location, rideId } = data;

      if (!this.isValidCoordinate(location.latitude, location.longitude)) {
        throw new BadRequestException('Invalid coordinates');
      }

      // Rate limiting
      if (this.shouldRateLimit(driverId)) {
        this.logger.debug(
          `Rate limiting location update for driver ${driverId}`,
        );
        return;
      }

      // Parse IDs to integers
      const driverIdInt = parseInt(driverId);
      const rideIdInt = parseInt(rideId);

      if (isNaN(driverIdInt) || isNaN(rideIdInt)) {
        throw new BadRequestException('Invalid driverId or rideId format');
      }

      // Save to Redis for quick access (with pipeline for atomicity)
      // const pipeline = this.redis.pipeline();
      // pipeline.set(
      //   `driver:${driverId}:location`,
      //   JSON.stringify(location),
      //   'EX',
      //   3600, // 1 hour TTL
      // );
      // pipeline.xadd(
      //   `stream:ride:${rideId}`,
      //   '*',
      //   'driverId',
      //   driverId,
      //   'location',
      //   JSON.stringify(location),
      //   'timestamp',
      //   Date.now(),
      // );
      // await pipeline.exec();

      // Save to PostgreSQL (FIXED: using proper entity relationships)
      await this.locationRepo.save({
        dailyRide: { id: rideIdInt }, // Reference by ID
        driver: { id: driverIdInt }, // Reference by ID
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(location.timestamp),
      });

      // Emit event for real-time updates
      // this.eventEmitter.emit(
      //   'location.updated',
      //   new LocationUpdatedEvent(driverId, rideId, location),
      // );

      this.logger.debug('Location update processed successfully');
    } catch (error) {
      this.logger.error('Failed to process location update:', error.stack);
      throw error;
    }
  }

  // Retrieves the latest location for a specific driver from Redis
  // Returns null if no location is found
  // async getLatestLocation(driverId: string) {
  //   try {
  //     const locationData = await this.redis.get(`driver:${driverId}:location`);
  //     return locationData ? JSON.parse(locationData) : null;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get latest location for driver ${driverId}:`,
  //       error,
  //     );
  //     return null;
  //   }
  // }
}
```

Module

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
// import { ParentGateway } from '../gateways/parent.gateway';
import { AuthModule } from '../auth/auth.module';
import { LocationEntity } from './infrastructure/persistence/relational/entities/location.entity';
import { JwtModule } from '@nestjs/jwt';
// import { RedisModule } from '../redis/redis.module';
// import { AppConfigModule } from '../config/appconfig.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    AuthModule,
    // RedisModule,
    // AppConfigModule,
  ],
  providers: [LocationService],
  exports: [LocationService, JwtModule],
})
export class LocationModule {}
```
