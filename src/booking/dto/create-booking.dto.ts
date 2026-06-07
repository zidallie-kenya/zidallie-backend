import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsEnum(['carpool', 'bus'])
  service_type!: 'carpool' | 'bus';

  @IsEnum(['dec-jan', 'apr-may', 'aug-sept'])
  term!: string;

  @IsEnum(['one_way', 'two_way'])
  trip_type!: string;

  @IsNumber()
  @Min(1)
  children_count!: number;

  // Carpool
  @IsOptional()
  @IsNumber()
  carpool_school_id?: number;

  @IsOptional()
  @IsString()
  home_area?: string;

  @IsOptional()
  @IsNumber()
  home_lat?: number;

  @IsOptional()
  @IsNumber()
  home_lon?: number;

  // Bus
  @IsOptional()
  @IsNumber()
  bus_school_id?: number;

  @IsOptional()
  @IsNumber()
  pickup_station_id?: number;
}
