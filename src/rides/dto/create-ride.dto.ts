// create-ride.dto.ts
import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  ValidateNested,
  IsObject,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RideStatus } from '../../utils/types/enums';
import { RideSchedule } from '../../utils/types/ride-schedule';

// Minimal DTOs for referenced entities to carry just `id`
class EntityIdDto {
  @IsInt()
  id: number;
}

export class CreateRideDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => EntityIdDto)
  vehicle?: EntityIdDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EntityIdDto)
  driver?: EntityIdDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EntityIdDto)
  school?: EntityIdDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EntityIdDto)
  student?: EntityIdDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => EntityIdDto)
  parent?: EntityIdDto | null;

  @IsOptional()
  @IsObject()
  schedule?: RideSchedule | null; // Could define more precise RideSchedule DTO if you want

  @IsOptional()
  @IsString()
  comments?: string | null;

  @IsOptional()
  @IsString()
  admin_comments?: string | null;

  @IsOptional()
  @IsObject()
  meta?: any | null;

  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @IsOptional()
  @IsArray()
  daily_rides?: any[]; // You can create a proper DTO for daily rides if needed
}
