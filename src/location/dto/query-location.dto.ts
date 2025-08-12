// location/dto/query-location.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterLocationDto {
  @ApiPropertyOptional({ type: Number, description: 'Filter by Daily Ride ID' })
  @IsOptional()
  @IsNumber()
  dailyRideId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by Driver ID' })
  @IsOptional()
  @IsNumber()
  driverId?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Filter by timestamp',
  })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class SortLocationDto {
  @ApiPropertyOptional({
    description: 'Field to order by',
    example: 'timestamp',
  })
  @IsOptional()
  orderBy?: string;

  @ApiPropertyOptional({
    description: 'Order direction',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @IsOptional()
  order?: 'ASC' | 'DESC';
}

export class QueryLocationDto {
  @ApiPropertyOptional({ type: FilterLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterLocationDto)
  filters?: FilterLocationDto;

  @ApiPropertyOptional({
    type: [SortLocationDto],
    description: 'Array of sort options',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortLocationDto)
  sort?: SortLocationDto[];

  @ApiPropertyOptional({ type: Number, default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    description: 'Items per page',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
