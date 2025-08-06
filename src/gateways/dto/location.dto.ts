import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: -1.286389, type: Number })
  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 36.817223, type: Number })
  @IsNotEmpty()
  @IsLongitude()
  longitude: number;

  @ApiProperty({ example: '2025-08-06T22:15:30Z', type: String })
  @IsNotEmpty()
  @IsDateString()
  timestamp: string;
}
