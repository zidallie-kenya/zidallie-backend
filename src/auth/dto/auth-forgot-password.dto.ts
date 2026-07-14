import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'parent', type: String })
  @IsOptional()
  @IsIn(['driver', 'parent'])
  clientType?: 'driver' | 'parent';
}
