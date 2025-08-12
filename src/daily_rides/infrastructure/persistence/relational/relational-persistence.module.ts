import { Module } from '@nestjs/common';
import { DailyRideRepository } from '../daily_rides.repository';
import { DailyRidesRelationalRepository } from './repositories/daily_rides.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyRideEntity } from './entities/daily_ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyRideEntity])],
  providers: [
    {
      provide: DailyRideRepository,
      useClass: DailyRidesRelationalRepository,
    },
  ],
  exports: [DailyRideRepository],
})
export class RelationalDailyRidePersistenceModule {}
