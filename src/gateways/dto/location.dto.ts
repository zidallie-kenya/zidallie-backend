import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsDateString,
  IsLongitude,
  IsLatitude,
} from 'class-validator';

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
export class LocationPayloadDto {
  @ApiProperty({ example: '50', type: String })
  @IsString()
  @IsNotEmpty()
  driverId: string;
  @ApiProperty({ example: '70', type: String })
  @IsString()
  @IsNotEmpty()
  rideId: string;
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
