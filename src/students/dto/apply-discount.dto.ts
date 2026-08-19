import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyDiscountDto {
  @ApiProperty({ example: 'ZIDONEWAY' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
