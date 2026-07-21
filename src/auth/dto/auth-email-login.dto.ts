import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ enum: ['CarpoolDriver', 'BusAttendant', 'Parent'] })
  @IsOptional() // <--- CHANGE THIS FROM @IsNotEmpty()
  @IsEnum(['CarpoolDriver', 'BusAttendant', 'Parent']) // Added for safety
  app_role?: 'CarpoolDriver' | 'BusAttendant' | 'Parent';
}
