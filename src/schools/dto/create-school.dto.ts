import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolMetaDto } from './school-meta.dto';

export class CreateSchoolDto {
  @ApiProperty({
    type: String,
    example: 'Nairobi Primary School',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Westlands, Nairobi',
    required: false,
  })
  @IsString()
  location: string;

  @ApiProperty({
    type: String,
    example: 'School opens at 7:00 AM',
    required: false,
  })
  @IsString()
  comments: string | null;

  @ApiProperty({
    type: String,
    example: 'https://nairobiprimary.ac.ke',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  url?: string | null;

  @ApiProperty({
    type: String,
    example: 'https://nairobiprimary.ac.ke',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  smart_card_url?: string | null;

  @ApiProperty({
    type: String,
    example: 'nairobiprimary@gmail.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_email?: string | null;

  @ApiProperty({
    type: String,
    example: '@nairobiprimary',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_password?: string | null;

  @ApiProperty({
    type: () => SchoolMetaDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => SchoolMetaDto)
  @IsOptional()
  meta?: SchoolMetaDto | null;
}
