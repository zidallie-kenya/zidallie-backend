import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { DailyRideStatus } from '../../utils/types/enums';

export class BatchUpdateDailyRideDto {
  @ApiProperty({
    description: 'IDs of daily rides to update',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({
    description: 'New status to set for all the rides',
    enum: DailyRideStatus,
  })
  @IsEnum(DailyRideStatus)
  status: DailyRideStatus;
}
