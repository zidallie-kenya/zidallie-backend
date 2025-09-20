import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Ride } from '../../rides/domain/rides';
import { Vehicle } from '../../vehicles/domain/vehicles';
import { User } from '../../users/domain/user';
import { DailyRideKind, DailyRideStatus } from '../../utils/types/enums';
import { DailyRideMeta } from '../../utils/types/daily-ride-meta';
import { DailyRideMetaDto } from '../dto/daily-ride-meta.dto';
import { Location } from '../../location/domain/location';

export class DailyRide {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => Ride })
  @Expose({ groups: ['me', 'admin'] })
  ride: Ride | null;

  @ApiProperty({ type: () => Vehicle })
  @Expose({ groups: ['me', 'admin'] })
  vehicle: Vehicle | null;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  driver: User | null;

  @ApiProperty({ enum: DailyRideKind })
  @Expose({ groups: ['me', 'admin'] })
  kind: DailyRideKind;

  @ApiProperty({ type: Date })
  @Expose({ groups: ['me', 'admin'] })
  date: Date;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  start_time: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  end_time: Date | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  comments: string | null;

  @ApiProperty({
    type: () => DailyRideMetaDto,
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  meta: DailyRideMeta | null;

  @ApiProperty({ enum: DailyRideStatus })
  @Expose({ groups: ['me', 'admin'] })
  status: DailyRideStatus;

  // Fix: Use your custom Location type instead of browser Location
  @ApiProperty({ type: () => [Location] })
  @Expose({ groups: ['me', 'admin'] })
  locations: Location[];

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  embark_time: Date | null;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  disembark_time: Date | null;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;
}
