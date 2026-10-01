// routes/dto/approve-route.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// Optional manual reorder before approval — admin drags stops around on the
// review map (Stage 6). If omitted, the solver's order is kept as-is.
class StopOrderDto {
  @IsInt()
  route_stop_id!: number;

  @IsInt()
  sequence_order!: number;
}

export class ApproveRouteDto {
  @ApiPropertyOptional({ type: [StopOrderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopOrderDto)
  reordered_stops?: StopOrderDto[];
}

export class ReassignDriverDto {
  @IsInt()
  new_driver_id!: number;

  @IsInt()
  new_vehicle_id!: number;

  // Live GPS ping to route from, instead of the driver's home — see
  // Route.origin_latitude/longitude on why this differs from a normal solve.
  @IsOptional()
  current_latitude?: number;

  @IsOptional()
  current_longitude?: number;
}

export class SolveTermDto {
  @IsString()
  term!: string;

  @IsString()
  trip_date!: string; // ISO date
}
export class SolveDto {
  @IsString()
  term!: string;

  @IsString()
  trip_date!: string; // The controller validation looks for this!
}
