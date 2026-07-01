import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DailyRideStatus } from '../../utils/types/enums';

export class BatchUpdateDailyRideDto {
  @ApiProperty({
    description: 'IDs of daily rides to update',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  ids!: number[];

  @ApiProperty({
    description: 'New status to set for all the rides',
    enum: DailyRideStatus,
  })
  @IsEnum(DailyRideStatus)
  status!: DailyRideStatus;

  @ApiPropertyOptional({
    description: 'Phone number to be used for payment (optional)',
    nullable: true,
    example: '254712345678',
  })
  @IsOptional()
  @IsString()
  payment_phone_number?: string | null;

  @ApiPropertyOptional({
    description: 'Amount to be paid (optional)',
    nullable: true,
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  amount_to_pay?: number | null;
}