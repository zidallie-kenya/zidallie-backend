import { Module } from '@nestjs/common';
import { DailyRidesService } from './daily_rides.service';
import { DailyRidesController } from './daily_rides.controller';

@Module({
  controllers: [DailyRidesController],
  providers: [DailyRidesService],
})
export class DailyRidesModule {}
