import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { UserKind, UserMetaDto } from '../../users/dto/user.dto'; // import types from your user module

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Parent', enum: ['Parent', 'Driver'] })
  @IsEnum(['Parent', 'Driver'])
  @IsNotEmpty()
  kind: UserKind;

  @ApiProperty({ example: '+254712345678' })
  @IsNotEmpty()
  phone_number?: string | null;

  @ApiProperty({ type: () => UserMetaDto, required: false })
  @IsOptional()
  @Type(() => UserMetaDto)
  meta?: UserMetaDto | null;
}
