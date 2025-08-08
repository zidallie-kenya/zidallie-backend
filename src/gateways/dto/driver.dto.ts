import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverPayloadDto {
  @ApiProperty({ example: '123', type: String })
  @IsString()
  @IsNotEmpty()
  driverId: string;
}
