// routes/dto/query-route.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RouteKind, RouteServiceType, RouteStatus } from '../domain/route';

export class FilterRouteDto {
  @ApiPropertyOptional({ example: 'aug-sept' })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'flagged', 'approved', 'active', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['draft', 'flagged', 'approved', 'active', 'completed', 'cancelled'])
  status?: RouteStatus;

  @ApiPropertyOptional({ enum: ['pickup', 'dropoff'] })
  @IsOptional()
  @IsEnum(['pickup', 'dropoff'])
  kind?: RouteKind;

  @ApiPropertyOptional({ enum: ['carpool', 'bus'] })
  @IsOptional()
  @IsEnum(['carpool', 'bus'])
  service_type?: RouteServiceType;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  trip_date?: string;
}

export class SortRouteDto {
  @ApiPropertyOptional({ example: 'created_at' })
  @IsString()
  orderBy: keyof any | undefined;

  @ApiPropertyOptional({ example: 'DESC' })
  @IsEnum(['ASC', 'DESC'])
  order!: 'ASC' | 'DESC';
}

export class QueryRouteDto {
  @ApiPropertyOptional({ type: FilterRouteDto })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? JSON.parse(value) : value,
  )
  @Type(() => FilterRouteDto)
  filters?: FilterRouteDto | null;

  @ApiPropertyOptional({ type: [SortRouteDto] })
  @IsOptional()
  @Transform(({ value }) =>
    value && typeof value === 'string' ? JSON.parse(value) : value,
  )
  @Type(() => SortRouteDto)
  sort?: SortRouteDto[] | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  limit?: number;
}
