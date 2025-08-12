import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  IsString,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DailyRideStatus, DailyRideKind } from '../../utils/types/enums';

// Sorting DTO
export class SortDailyRideDto {
  @ApiPropertyOptional({ example: 'date' })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}

// Filtering DTO
export class FilterDailyRideDto {
  @ApiPropertyOptional({ enum: DailyRideStatus })
  @IsOptional()
  @IsEnum(DailyRideStatus)
  status?: DailyRideStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rideId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vehicleId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  driverId?: number;

  @ApiPropertyOptional({ enum: DailyRideKind })
  @IsOptional()
  @IsEnum(DailyRideKind)
  kind?: DailyRideKind;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class QueryDailyRideDto {
  @ApiPropertyOptional({ type: FilterDailyRideDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDailyRideDto)
  filters?: FilterDailyRideDto;

  @ApiPropertyOptional({ type: [SortDailyRideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDailyRideDto)
  sort?: SortDailyRideDto[];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}

export type InfinityPaginationResultType<T> = {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;
  total?: number; // optional
};

export function infinityPagination<T>(
  items: T[],
  pagination: { page: number; limit: number },
): InfinityPaginationResultType<T> {
  const { page, limit } = pagination;
  return {
    items,
    page,
    limit,
    hasMore: items.length === limit,
  };
}

export class InfinityPaginationResponseDto<T> {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;

  constructor(data: {
    items: T[];
    page: number;
    limit: number;
    hasMore: boolean;
  }) {
    this.items = data.items;
    this.page = data.page;
    this.limit = data.limit;
    this.hasMore = data.hasMore;
  }
}
