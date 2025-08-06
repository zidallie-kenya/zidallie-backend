import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PickupPayloadDto {
  @ApiProperty({ example: '50', type: String })
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({ example: '100', type: String })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiProperty({ example: 'fhdagye565gfgghy', type: String })
  @IsString()
  @IsNotEmpty()
  parentSocketId: string;
}
