import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PickupAllPayloadDto {
  @ApiProperty({ example: '50', type: String })
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({ example: '70', type: String })
  @IsString()
  @IsNotEmpty()
  rideId: string;
}
