import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthConfirmEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hash: string;
}
