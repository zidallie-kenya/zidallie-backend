// location/location.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './infrastructure/persistence/relational/entities/location.entity';
import { LocationRepository } from './infrastructure/persistence/location.repository';
import { DailyRideEntity } from '../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { DailyRidesModule } from '../daily_rides/daily_rides.module';
import { LocationsController } from './location.controller';
import { LocationsService } from './location.service';
import { LocationsRelationalRepository } from './infrastructure/persistence/relational/repositories/location.repository';
import { LocationGateway } from './location.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationEntity, DailyRideEntity, UserEntity]),
    UsersModule,
    DailyRidesModule,
  ],
  controllers: [LocationsController],
  providers: [
    LocationsService,
    {
      provide: LocationRepository,
      useClass: LocationsRelationalRepository,
    },
    LocationGateway, // 👈 register gateway as provider
  ],
  exports: [LocationsService],
})
export class LocationModule {}
