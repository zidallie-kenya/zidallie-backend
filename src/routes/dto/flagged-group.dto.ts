import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryFlaggedGroupedDto {
  @IsString()
  @IsNotEmpty()
  term!: string;

  @IsOptional()
  @IsString()
  trip_date!: string;
}

export class AssignGroupDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  stop_ids!: number[];

  @IsInt()
  @Type(() => Number)
  driver_id!: number;

  @IsInt()
  @Type(() => Number)
  vehicle_id!: number;
}
