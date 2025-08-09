import { PartialType } from '@nestjs/swagger';
import { CreateDailyRideDto } from './create-daily_ride.dto';

export class UpdateDailyRideDto extends PartialType(CreateDailyRideDto) {}
