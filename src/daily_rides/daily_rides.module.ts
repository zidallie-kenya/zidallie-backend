// daily_rides/daily_rides.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DailyRidesService } from './daily_rides.service';
import { DailyRidesController } from './daily_rides.controller';
import { RidesModule } from '../rides/rides.module';
import { UsersModule } from '../users/users.module';
import { VehicleModule } from '../vehicles/vehicles.module';
import { RelationalDailyRidePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ExpoPushService } from './expopush.service';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    RelationalDailyRidePersistenceModule,
    RidesModule,
    VehicleModule,
    UsersModule,
    forwardRef(() => LocationModule),
  ],
  controllers: [DailyRidesController],
  providers: [DailyRidesService, ExpoPushService],
  exports: [DailyRidesService],
})
export class DailyRidesModule {}
