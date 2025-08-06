import { LocationPayloadDto } from './dto/location.dto';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { LocationEntity } from './entities/location.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationUpdatedEvent } from './location.events';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LocationService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(LocationEntity)
    private readonly locationRepo: Repository<LocationEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleLocation(data: LocationPayloadDto) {
    const { driverId, location, rideId } = data;

    //save to redis for first access
    await this.redis.set(
      `driver:${driverId}:location`,
      JSON.stringify(location),
    );

    //push to redis stream
    await this.redis.xadd(
      `stream:ride:${rideId}`,
      '*',
      'driverId',
      driverId,
      'location',
      JSON.stringify(location),
    );

    // 📌 Save to PostgreSQL (permanent storage)
    await this.locationRepo.save({
      driverId,
      rideId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date(location.timestamp),
    });

    // ✅ Emit to gateways via event
    this.eventEmitter.emit(
      'location.updated',
      new LocationUpdatedEvent(driverId, rideId, location),
    );
  }
}
