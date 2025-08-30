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
    type: () => SchoolMetaDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => SchoolMetaDto)
  @IsOptional()
  meta?: SchoolMetaDto | null;
}
