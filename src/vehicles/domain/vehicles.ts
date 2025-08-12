import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';
import { Ride } from '../../rides/domain/rides';
import { DailyRide } from '../../daily_rides/domain/daily_rides';

export class Vehicle {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  user: User | null;

  @ApiProperty({
    type: String,
    example: 'School Bus Alpha',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_name: string | null;

  @ApiProperty({ type: String, example: 'KCA 123A' })
  @Expose({ groups: ['me', 'admin'] })
  registration_number: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.Bus })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_type: VehicleType;

  @ApiProperty({ type: String, example: 'Toyota Hiace' })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_model: string;

  @ApiProperty({ type: Number, example: 2018 })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_year: number;

  @ApiProperty({
    type: String,
    example: 'https://example.com/vehicles/bus123.jpg',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_image_url: string | null;

  @ApiProperty({ type: Number, example: 14 })
  @Expose({ groups: ['me', 'admin'] })
  seat_count: number;

  @ApiProperty({ type: Number, example: 12 })
  @Expose({ groups: ['me', 'admin'] })
  available_seats: number;

  @ApiProperty({ type: Boolean, example: true })
  @Expose({ groups: ['me', 'admin'] })
  is_inspected: boolean;

  @ApiProperty({
    type: String,
    example: 'Recently serviced, good condition',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  comments: string | null;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  meta: any | null;

  @ApiProperty({
    type: String,
    example: 'https://example.com/docs/registration123.pdf',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_registration: string | null;

  @ApiProperty({
    type: String,
    example: 'https://example.com/docs/insurance123.pdf',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  insurance_certificate: string | null;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  vehicle_data: any | null;

  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.Active })
  @Expose({ groups: ['me', 'admin'] })
  status: VehicleStatus;

  @ApiProperty({ type: () => [Ride] })
  @Expose({ groups: ['me', 'admin'] })
  rides: Ride[];

  @ApiProperty({ type: () => [DailyRide] })
  @Expose({ groups: ['me', 'admin'] })
  daily_rides: DailyRide[];

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;
}
