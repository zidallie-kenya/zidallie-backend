// location/dto/create-location.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  dailyRideId: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  driverId: number;

  @ApiProperty({ type: Number, example: -1.2921 })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ type: Number, example: 36.8219 })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  @IsNotEmpty()
  timestamp: string;
}
