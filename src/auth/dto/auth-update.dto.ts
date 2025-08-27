import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { UserKind } from '../../users/dto/user.dto'; // or wherever you've defined it
import { UserMetaDto } from '../../users/dto/user.dto';

export class AuthUpdateDto {
  @ApiPropertyOptional({ type: String, example: '1234567890.jpg' })
  @IsOptional()
  photo?: string | null;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  phone_number?: string | null;

  @ApiPropertyOptional({ enum: ['Parent', 'Driver'] })
  @IsOptional()
  @IsEnum(['Parent', 'Driver'])
  kind?: UserKind;

  @ApiPropertyOptional({ type: () => UserMetaDto })
  @IsOptional()
  @Type(() => UserMetaDto)
  meta?: UserMetaDto | null;

  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword?: string;
}
