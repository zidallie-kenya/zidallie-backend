import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';

export class CreateVehicleDto {
  @ApiPropertyOptional({
    description: 'User ID owning the vehicle',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  user?: { id: number } | null;

  @ApiPropertyOptional({
    description: 'Vehicle name',
    example: 'School Bus Alpha',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  vehicle_name?: string | null;

  @ApiProperty({
    description: 'Unique vehicle registration number',
    example: 'KCA 123A',
  })
  @IsString()
  registration_number: string;

  @ApiProperty({
    description: 'Vehicle type',
    enum: VehicleType,
    example: VehicleType.Bus,
  })
  @IsEnum(VehicleType)
  vehicle_type: VehicleType;

  @ApiProperty({
    description: 'Vehicle model',
    example: 'Toyota Hiace',
  })
  @IsString()
  vehicle_model: string;

  @ApiProperty({
    description: 'Year of manufacture',
    example: 2018,
  })
  @IsNumber()
  vehicle_year: number;

  @ApiPropertyOptional({
    description: 'Vehicle image file ID',
    example: 'dsjkhfdjhgudgut.jpg',
    nullable: true,
  })
  @IsOptional()
  vehicle_image_url?: string | null;

  @ApiProperty({
    description: 'Total seat count',
    example: 14,
  })
  @IsNumber()
  seat_count: number;

  @ApiProperty({
    description: 'Number of available seats',
    example: 12,
  })
  @IsNumber()
  available_seats: number;

  @ApiPropertyOptional({
    description: 'Has vehicle passed inspection',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_inspected?: boolean;

  @ApiPropertyOptional({
    description: 'Additional comments',
    example: 'Recently serviced, good condition',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  comments?: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    nullable: true,
    type: Object,
  })
  @IsOptional()
  meta?: any | null;

  @ApiPropertyOptional({
    description: 'Vehicle registration string',
    nullable: true,
  })
  @IsOptional()
  vehicle_registration?: string | null;

  @ApiPropertyOptional({
    description: 'Insurance certificate file string',
    nullable: true,
  })
  @IsOptional()
  insurance_certificate?: string | null;

  @ApiPropertyOptional({
    description: 'Additional vehicle data (JSON)',
    nullable: true,
    type: Object,
  })
  @IsOptional()
  vehicle_data?: any | null;

  @ApiPropertyOptional({
    description: 'Vehicle status',
    enum: VehicleStatus,
    example: VehicleStatus.Active,
    default: VehicleStatus.Active,
  })
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status: VehicleStatus;
}
