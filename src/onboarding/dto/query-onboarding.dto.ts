// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { IsDateString, IsOptional, IsString } from 'class-validator';
// import { Type } from 'class-transformer';
// import { User } from '../../users/domain/user';
// import { Gender, RideType } from '../../utils/types/enums';

// export class FilterOnboardingDto {
//   @ApiPropertyOptional({ type: String, example: 'John' })
//   @IsOptional()
//   @IsString()
//   parent_name?: string;

//   @ApiPropertyOptional({ type: String, example: 'uhuru primary school' })
//   @IsOptional()
//   @IsString()
//   school?: string;

//   @ApiPropertyOptional({ type: String, example: 'uhuru primary school' })
//   @IsOptional()
//   @IsString()
//   schoolId?: string;

//   @ApiPropertyOptional({ type: String, example: 'uhuru primary school' })
//   @IsOptional()
//   @IsString()
//   parent_email?: string;

//   @ApiPropertyOptional({ type: String, example: 'uhuru primary school' })
//   @IsOptional()
//   @IsString()
//   parent_phone?: string;

//   @ApiPropertyOptional({ type: String, example: 'uhuru primary school' })
//   @IsOptional()
//   @IsString()
//   student_gender: Gender;

//   @ApiPropertyOptional({
//     type: String,
//     example: 'pickup or dropoff or dropoff&pickup',
//   })
//   @IsOptional()
//   @IsString()
//   ride_type?: RideType;

//   @ApiPropertyOptional({ type: Date, example: '7/5/2025' })
//   @IsOptional()
//   @IsDateString()
//   start_date?: Date;

//   @ApiPropertyOptional({ type: Date, example: '7/5/2025' })
//   @IsOptional()
//   @IsDateString()
//   mid_term?: Date;

//   @ApiPropertyOptional({ type: Date, example: '7/5/2025' })
//   @IsOptional()
//   @IsDateString()
//   end_date?: Date;
// }

// export class SortOnboardingDto {
//   @ApiProperty()
//   @Type(() => String)
//   @IsString()
//   orderBy: keyof User;

//   @ApiProperty()
//   @IsString()
//   order: 'asc' | 'desc';
// }

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Gender, RideType } from '../../utils/types/enums';

export class FilterOnboardingDto {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'School ID to filter by',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  schoolId?: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Parent email to filter by',
  })
  @IsOptional()
  @IsString()
  parent_email?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Parent phone to filter by',
  })
  @IsOptional()
  @IsString()
  parent_phone?: string;

  @ApiProperty({
    enum: Gender,
    required: false,
    description: 'Student gender to filter by',
  })
  @IsOptional()
  @IsEnum(Gender)
  student_gender?: Gender;

  @ApiProperty({
    enum: RideType,
    required: false,
    description: 'Ride type to filter by',
  })
  @IsOptional()
  @IsEnum(RideType)
  ride_type?: RideType;
}

export class SortOnboardingDto {
  @ApiProperty()
  @IsString()
  orderBy: keyof {
    id: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    student_name: string;
    student_gender: Gender;
    ride_type: RideType;
    created_at: Date;
  };

  @ApiProperty()
  @IsEnum(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class QueryOnboardingDto {
  @ApiProperty({
    required: false,
    type: Number,
    description: 'Page number',
  })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ type: FilterOnboardingDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterOnboardingDto)
  filters?: FilterOnboardingDto | null;

  @ApiProperty({ type: [SortOnboardingDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortOnboardingDto)
  sort?: SortOnboardingDto[] | null;
}
