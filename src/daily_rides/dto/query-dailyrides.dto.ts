import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DailyRideKind, DailyRideStatus } from '../../utils/types/enums';

export class FilterDailyRideDto {
  @ApiPropertyOptional({ description: 'Filter by Ride ID', type: Number })
  rideId?: number;

  @ApiPropertyOptional({ description: 'Filter by Vehicle ID', type: Number })
  vehicleId?: number;

  @ApiPropertyOptional({ description: 'Filter by Driver ID', type: Number })
  driverId?: number;

  @ApiPropertyOptional({ enum: DailyRideKind, description: 'Filter by kind' })
  kind?: DailyRideKind;

  @ApiPropertyOptional({
    enum: DailyRideStatus,
    description: 'Filter by status',
  })
  status?: DailyRideStatus;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Filter by date',
  })
  date?: Date; // using string here for easier input; convert to Date as needed
}

export class SortDailyRideDto {
  @ApiProperty({ description: 'Field to order by', example: 'date' })
  orderBy: string;

  @ApiProperty({
    description: 'Order direction',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  order: 'ASC' | 'DESC';
}
