// src/location/dto/location-update-payload.dto.ts
import { IsNumber, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationUpdatePayloadDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  driverId: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  latitude: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  longitude: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ type: Number, required: false })
  @IsNumber()
  @IsOptional()
  dailyRideId?: number;
}
