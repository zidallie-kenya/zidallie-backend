import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';
import { CreateVehicleReportDto } from './create-vehicle_report.dto';
import { Transform, Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  })
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
  @Type(() => Number) // <--- Convert string "2020" to number 2020
  vehicle_year!: number;

  @ApiPropertyOptional({ example: 'bus_image.jpg', nullable: true })
  @IsOptional()
  vehicle_image_url?: string | null;

  @ApiPropertyOptional({ example: 'bus_image_front.jpg', nullable: true })
  @IsOptional()
  vehicle_image_url_front?: string | null;

  @ApiPropertyOptional({ example: 'bus_image_back.jpg', nullable: true })
  @IsOptional()
  vehicle_image_url_back?: string | null;

  @ApiPropertyOptional({ example: 'bus_image_inside.jpg', nullable: true })
  @IsOptional()
  vehicle_image_url_inside?: string | null;

  @ApiPropertyOptional({ example: 'minder_id.jpg', nullable: true })
  @IsOptional()
  minders_id_url?: string | null;

  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  @IsOptional()
  @IsString()
  minders_name?: string | null;

  @ApiProperty({ example: 14 })
  @IsNumber()
  @Type(() => Number) // <--- Convert string "6" to number 6
  seat_count!: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Type(() => Number) // <--- Convert string "6" to number 6
  available_seats!: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true) // <--- Convert string "false" to boolean false
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

  @ApiPropertyOptional({
    example: '2027-06-30',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  insurance_certificate_expiry?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  logbook?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  vehicle_inspection_report?: string | null;

  @ApiPropertyOptional({
    example: '2027-06-30',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  vehicle_inspection_expiry?: Date | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  @IsOptional()
  vehicle_data?: any | null;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.Active })
  @IsNotEmpty()
  @IsEnum(VehicleStatus)
  status!: VehicleStatus;

  // This handles the historical reports relationship
  @ApiPropertyOptional({ type: [CreateVehicleReportDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleReportDto)
  vehicle_report?: CreateVehicleReportDto[];
}
