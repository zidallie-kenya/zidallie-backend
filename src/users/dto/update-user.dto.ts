import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { RoleDto } from '../../roles/dto/role.dto';
import { StatusDto } from '../../statuses/dto/status.dto';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { UserMetaDto } from './user.dto';

export type UserKind = 'Parent' | 'Driver' | 'Admin';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  provider?: string;

  @IsOptional()
  socialId?: string | null;

  @ApiPropertyOptional({ example: 'John', type: String })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', type: String })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ example: '+254712345678', type: String })
  @IsOptional()
  @IsString()
  phone_number?: string | null;

  @ApiPropertyOptional({
    example: 'ExponentPushToken[QxGljeKLHqZPRsgb9R6GxX]',
    type: String,
  })
  @IsOptional()
  @IsString()
  push_token?: string | null;

  @ApiPropertyOptional({ enum: ['Parent', 'Driver', 'Admin'] })
  @IsOptional()
  @IsEnum(['Parent', 'Driver', 'Admin'])
  kind?: UserKind;

  @ApiPropertyOptional({ type: () => UserMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserMetaDto)
  meta?: UserMetaDto | null;

  @ApiPropertyOptional({ example: 250.0, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wallet_balance?: number;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  @IsBoolean()
  is_kyc_verified?: boolean;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  @Type(() => FileDto)
  photo?: FileDto | null;

  @ApiPropertyOptional({ type: () => RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto | null;

  @ApiPropertyOptional({ type: () => StatusDto })
  @IsOptional()
  @Type(() => StatusDto)
  status?: StatusDto;
}
