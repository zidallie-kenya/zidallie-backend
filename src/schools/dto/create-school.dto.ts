import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchoolMetaDto } from './school-meta.dto';

export type ServiceType = 'school' | 'carpool' | 'private';

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
  @IsOptional()
  location?: string | null;

  @ApiProperty({
    type: String,
    example: '254722222222',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  disbursement_phone_number?: string | null;

  @ApiProperty({
    type: String,
    example: '247247',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  bank_paybill_number?: string | null;

  @ApiProperty({
    type: String,
    example: '0232324',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  bank_account_number?: string | null;

  @ApiProperty({
    type: String,
    example: 'School opens at 7:00 AM',
    required: false,
  })
  @IsString()
  @IsOptional()
  comments?: string | null;

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
    example: 'https://smartcard.nairobiprimary.ac.ke',
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
    example: 'nhjjjk565e5hdjk',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_tag_id?: string | null;

  @ApiProperty({
    type: String,
    example: '@nairobiprimary',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_password?: string | null;

  @ApiProperty({
    type: String,
    example: 'zone_tag_123',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_zone_tag?: string | null;

  @ApiProperty({
    type: String,
    example: 'parents_tag_456',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_parents_tag?: string | null;

  @ApiProperty({
    type: String,
    example: 'student_tag_789',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_student_tag?: string | null;

  @ApiProperty({
    type: String,
    example: 'school_tag_012',
    required: false,
  })
  @IsString()
  @IsOptional()
  terra_school_tag?: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  has_commission?: boolean;

  @ApiProperty({
    type: Number,
    example: 150,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  commission_amount?: number | null;

  @ApiProperty({
    type: String,
    example: '247247',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  paybill?: string | null;

  @ApiProperty({
    enum: ['school', 'carpool', 'private'],
    required: false,
    nullable: true,
  })
  @IsEnum(['school', 'carpool', 'private'])
  @IsOptional()
  service_type?: ServiceType | null;

  @ApiProperty({
    type: () => SchoolMetaDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => SchoolMetaDto)
  @IsOptional()
  meta?: SchoolMetaDto | null;
}
