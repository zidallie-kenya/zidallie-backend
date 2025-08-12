import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RideStatus } from '../../utils/types/enums';

class FiltersDto {
  @ApiPropertyOptional({ description: 'Filter by vehicle ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicleId?: number;

  @ApiPropertyOptional({ description: 'Filter by driver ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  driverId?: number;

  @ApiPropertyOptional({ description: 'Filter by school ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  schoolId?: number;

  @ApiPropertyOptional({ description: 'Filter by student ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @ApiPropertyOptional({ description: 'Filter by parent ID', type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Filter by ride status',
    enum: RideStatus,
  })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;
}

class SortDto {
  @ApiPropertyOptional({
    description: 'Sort by field (e.g. date, createdAt, status)',
    type: String,
  })
  @IsOptional()
  @IsString()
  orderBy?: string; // changed from sortBy

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC'; // changed from sortDirection
}

export class QueryRideDto {
  @ApiPropertyOptional({ type: FiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;

  // Change here: from single SortDto to array of SortDto
  @ApiPropertyOptional({ type: [SortDto] }) // <-- note the array []
  @IsOptional()
  @IsArray() // <-- validate as array
  @ValidateNested({ each: true }) // <-- validate nested objects inside array
  @Type(() => SortDto)
  sort?: SortDto[];

  @ApiPropertyOptional({ description: 'Page number', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit per page',
    default: 10,
    maximum: 50,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
