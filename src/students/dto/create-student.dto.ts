import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsUrl,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../../utils/types/enums';

export class SchoolReferenceDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsNumber()
  id: number;
}

export class ParentReferenceDto {
  @ApiProperty({ type: Number, example: 1 })
  @IsNumber()
  id: number;
}

export class CreateStudentDto {
  @ApiProperty({ type: String, example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: () => SchoolReferenceDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchoolReferenceDto)
  school?: SchoolReferenceDto;

  @ApiProperty({ type: () => ParentReferenceDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ParentReferenceDto)
  parent?: ParentReferenceDto;

  @ApiProperty({
    type: String,
    example: 'https://example.com/profiles/jane.jpg',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  profile_picture?: string | null;

  @ApiProperty({ enum: Gender, example: Gender.Female })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    type: String,
    example: '123 Karen Road, Nairobi',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiProperty({
    type: String,
    example: 'Allergic to peanuts',
    required: false,
  })
  @IsString()
  @IsOptional()
  comments?: string | null;

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  meta?: any | null;

  // 🆕 Payment fields
  @ApiProperty({ type: String, example: 'ACC123', required: false })
  @IsOptional()
  @IsString()
  account_number?: string | null;

  @ApiProperty({ type: Number, example: 500, required: false })
  @IsOptional()
  @IsNumber()
  daily_fee?: number | null;

  @ApiProperty({ type: Number, example: 12000, required: false })
  @IsOptional()
  @IsNumber()
  transport_term_fee?: number | null;

  @ApiProperty({
    enum: ['school', 'carpool', 'private'],
    example: 'school',
    required: false,
  })
  @IsOptional()
  @IsString()
  service_type?: 'school' | 'carpool' | 'private' | null;
}
