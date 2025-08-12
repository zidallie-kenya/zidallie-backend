// daily_rides/daily_rides.module.ts
import { Module } from '@nestjs/common';
import { DailyRidesService } from './daily_rides.service';
import { DailyRidesController } from './daily_rides.controller';
import { RidesModule } from '../rides/rides.module';
import { UsersModule } from '../users/users.module';
import { VehicleModule } from '../vehicles/vehicles.module';
import { RelationalDailyRidePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalDailyRidePersistenceModule,
    RidesModule,
    VehicleModule,
    UsersModule,
  ],
  controllers: [DailyRidesController],
  providers: [DailyRidesService],
  exports: [DailyRidesService],
})
export class DailyRidesModule {}
