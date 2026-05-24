import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';
import { CreateVehicleReportDto } from './create-vehicle_report.dto';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  user?: { id: number } | null;

  @ApiPropertyOptional({ example: 'School Bus Alpha', nullable: true })
  @IsOptional()
  @IsString()
  vehicle_name?: string | null;

  @ApiProperty({ example: 'KCA 123A' })
  @IsString()
  @IsNotEmpty()
  registration_number!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.Bus })
  @IsEnum(VehicleType)
  vehicle_type!: VehicleType;

  @ApiProperty({ example: 'Toyota Hiace' })
  @IsString()
  vehicle_model!: string;

  @ApiProperty({ example: 2018 })
  @IsNumber()
  vehicle_year!: number;

  @ApiPropertyOptional({ example: 'bus_image.jpg', nullable: true })
  @IsOptional()
  vehicle_image_url?: string | null;

  @ApiPropertyOptional({ example: 'minder_id.jpg', nullable: true })
  @IsOptional()
  minders_id_url?: string | null;

  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  @IsOptional()
  @IsString()
  minders_name?: string | null;

  @ApiProperty({ example: 14 })
  @IsNumber()
  seat_count!: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  available_seats!: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  is_inspected?: boolean;

  @ApiPropertyOptional({ example: 'Good condition', nullable: true })
  @IsOptional()
  @IsString()
  comments?: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  meta?: any | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  vehicle_registration?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  insurance_certificate?: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  vehicle_data?: any | null;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.Active })
  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status!: VehicleStatus;

  // This handles the historical reports relationship
  @ApiPropertyOptional({ type: [CreateVehicleReportDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleReportDto)
  vehicle_report?: CreateVehicleReportDto[];
}
