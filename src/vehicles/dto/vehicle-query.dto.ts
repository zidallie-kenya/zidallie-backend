import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';

export class FilterVehicleDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'User ID to filter by',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  userId?: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Registration number to filter by (partial match)',
  })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({
    enum: VehicleType,
    required: false,
    description: 'Vehicle type to filter by',
  })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicle_type?: VehicleType;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Vehicle model to filter by (partial match)',
  })
  @IsOptional()
  @IsString()
  vehicle_model?: string;

  @ApiProperty({
    enum: VehicleStatus,
    required: false,
    description: 'Vehicle status to filter by',
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiProperty({
    type: Boolean,
    required: false,
    description: 'Filter by inspection status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  is_inspected?: boolean;
}

export class SortVehicleDto {
  @ApiProperty()
  @IsString()
  orderBy: keyof {
    id: number;
    vehicle_name: string;
    registration_number: string;
    vehicle_type: VehicleType;
    vehicle_model: string;
    vehicle_year: number;
    seat_count: number;
    available_seats: number;
    is_inspected: boolean;
    status: VehicleStatus;
    created_at: Date;
    updated_at: Date;
  };

  @ApiProperty()
  @IsEnum(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class QueryVehicleDto {
  @ApiProperty({
    required: false,
    type: Number,
    description: 'Page number',
  })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ type: FilterVehicleDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterVehicleDto)
  filters?: FilterVehicleDto | null;

  @ApiProperty({ type: [SortVehicleDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortVehicleDto)
  sort?: SortVehicleDto[] | null;
}
