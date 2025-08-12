import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DailyRide } from '../../daily_rides/domain/daily_rides';
import { User } from '../../users/domain/user';

export class Location {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => DailyRide })
  @Expose({ groups: ['me', 'admin'] })
  daily_ride: DailyRide;

  @ApiProperty({ type: () => User })
  @Expose({ groups: ['me', 'admin'] })
  driver: User;

  @ApiProperty({ type: Number, example: -1.2921 })
  @Expose({ groups: ['me', 'admin'] })
  latitude: number;

  @ApiProperty({ type: Number, example: 36.8219 })
  @Expose({ groups: ['me', 'admin'] })
  longitude: number;

  @ApiProperty({ type: Date })
  @Expose({ groups: ['me', 'admin'] })
  timestamp: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
