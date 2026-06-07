import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CarpoolSchool } from './carpool-school';
import { BusSchool } from './bus-school';
import { PickupStation } from './pickup-station';
import { Cluster } from './cluster';
import { BookingChild } from './booking-child';
import { BookingDeposit } from './booking-deposit';

export class Booking {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: Number })
  @Expose()
  parent_id!: number;

  @ApiProperty({ type: String })
  @Expose()
  service_type!: string;

  @ApiProperty({ type: String })
  @Expose()
  term!: string;

  @ApiProperty({ type: String })
  @Expose()
  trip_type!: string;

  @ApiProperty({ type: Number })
  @Expose()
  children_count!: number;

  @ApiProperty({ type: () => CarpoolSchool, nullable: true })
  @Expose()
  carpool_school!: CarpoolSchool | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  home_area!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  home_lat!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  home_lon!: number | null;

  @ApiProperty({ type: () => BusSchool, nullable: true })
  @Expose()
  bus_school!: BusSchool | null;

  @ApiProperty({ type: () => PickupStation, nullable: true })
  @Expose()
  pickup_station!: PickupStation | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  region!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  distance_km!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  price_per_child!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  total_price!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  deposit_amount!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  balance_amount!: number | null;

  @ApiProperty({ type: () => Cluster, nullable: true })
  @Expose()
  cluster!: Cluster | null;

  @ApiProperty({ type: Boolean })
  @Expose()
  is_waitlisted!: boolean;

  @ApiProperty({ type: String })
  @Expose()
  status!: string;

  @ApiProperty({ type: Number })
  @Expose()
  total_paid!: number;

  @ApiProperty({ type: Date, nullable: true })
  @Expose()
  waitlist_started_at!: Date | null;

  @ApiProperty({ type: () => [BookingChild] })
  @Expose()
  children!: BookingChild[];

  @ApiProperty({ type: () => [BookingDeposit] })
  @Expose()
  deposits!: BookingDeposit[];

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;

  constructor(partial?: Partial<Booking>) {
    Object.assign(this, partial);
  }
}
