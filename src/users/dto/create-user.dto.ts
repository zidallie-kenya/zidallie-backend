import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { RoleDto } from '../../roles/dto/role.dto';
import { StatusDto } from '../../statuses/dto/status.dto';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { UserMetaDto } from './user.dto'; // adjust path if needed

export type UserKind = 'Parent' | 'Driver' | 'Admin';

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'email' })
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  socialId?: string | null;

  @ApiProperty({ example: 'John', type: String })
  @IsNotEmpty()
  firstName: string | null;

  @ApiProperty({ example: 'Doe', type: String })
  @IsNotEmpty()
  lastName: string | null;

  @ApiPropertyOptional({ example: '+254712345678', type: String })
  @IsOptional()
  @IsString()
  phone_number?: string | null;

  @ApiProperty({ enum: ['Parent', 'Driver', 'Admin'] })
  @IsNotEmpty()
  @IsEnum(['Parent', 'Driver', 'Admin'])
  kind: UserKind;

  @ApiPropertyOptional({ type: () => UserMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserMetaDto)
  meta?: UserMetaDto | null;

  @ApiPropertyOptional({ example: 0.0, type: Number })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wallet_balance?: number;

  @ApiPropertyOptional({ type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  is_kyc_verified?: boolean;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
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
