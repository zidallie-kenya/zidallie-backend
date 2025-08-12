import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { RideStatus } from '../../utils/types/enums';
import { IsString, IsEnum } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterRideDto {
  @ApiPropertyOptional({ type: Number, description: 'Filter by Vehicle ID' })
  vehicleId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by Driver ID' })
  driverId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by School ID' })
  schoolId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by Student ID' })
  studentId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by Parent ID' })
  parentId?: number;

  @ApiPropertyOptional({
    enum: RideStatus,
    description: 'Filter by Ride Status',
  })
  status?: RideStatus;
}

export class SortRideDto {
  @ApiProperty({ description: 'Field to order by', example: 'created_at' })
  @IsString()
  orderBy: string;

  @ApiProperty({
    description: 'Order direction',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsEnum(SortDirection)
  order: SortDirection;
}
