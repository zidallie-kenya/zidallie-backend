import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus, VehicleType } from '../../utils/types/enums';

export class FilterVehicleDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Filter by User ID (owner)',
  })
  userId?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial registration number',
  })
  registration_number?: string;

  @ApiPropertyOptional({
    enum: VehicleType,
    description: 'Filter by vehicle type',
  })
  vehicle_type?: VehicleType;

  @ApiPropertyOptional({
    type: String,
    description: 'Filter by partial vehicle model',
  })
  vehicle_model?: string;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    description: 'Filter by vehicle status',
  })
  status?: VehicleStatus;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter by inspection status',
  })
  is_inspected?: boolean;
}

export class SortVehicleDto {
  @ApiProperty({ description: 'Field to sort by', example: 'vehicle_name' })
  orderBy: string;

  @ApiProperty({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  order: 'ASC' | 'DESC';
}
