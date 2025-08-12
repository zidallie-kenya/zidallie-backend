import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender, RideType } from '../../utils/types/enums';
import { School } from '../../schools/domain/schools';

export class CreateOnboardingDto {
  @ApiProperty({ type: String, example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  parent_name: string;

  @ApiProperty({
    type: String,
    example: 'parent@example.com',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (value === '' ? null : value))
  parent_email?: string | null;

  @ApiProperty({
    type: String,
    example: '+254712345678',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  parent_phone?: string | null;

  @ApiProperty({
    type: String,
    example: '123 Main Street, Nairobi',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  address?: string | null;

  @ApiProperty({ type: String, example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  student_name: string;

  @ApiProperty({ enum: Gender, example: Gender.Female })
  @IsEnum(Gender)
  student_gender: Gender;

  @ApiProperty({ type: () => School })
  @ValidateNested()
  @Type(() => School)
  school: School;

  @ApiProperty({ enum: RideType, example: RideType.PickupAndDropoff })
  @IsEnum(RideType)
  ride_type: RideType;

  @ApiProperty({
    type: String,
    example: 'Westlands Shopping Center',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  pickup?: string | null;

  @ApiProperty({
    type: String,
    example: 'Karen Shopping Center',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  dropoff?: string | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    value === '' ? null : value ? new Date(value) : null,
  )
  start_date?: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    value === '' ? null : value ? new Date(value) : null,
  )
  mid_term?: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) =>
    value === '' ? null : value ? new Date(value) : null,
  )
  end_date?: Date | null;
}
