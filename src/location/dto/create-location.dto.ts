// location/dto/create-location.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional() // <-- allows missing or null
  @IsNumber()
  dailyRideId?: number; // <-- optional

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
