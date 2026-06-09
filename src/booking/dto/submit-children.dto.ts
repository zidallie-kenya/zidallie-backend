// submit-children.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EmergencyContactRole } from '../infrastructure/persistence/relational/entities/booking-child.entity';

export class ChildDetailDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  grade_class?: string;

  @IsOptional()
  @IsString()
  pickup_time?: string;

  @IsOptional()
  @IsString()
  dropoff_time?: string;

  @IsEnum(EmergencyContactRole)
  emergency_contact!: string;

  @IsString()
  emergency_contact_phone!: string;

  @IsOptional()
  @IsEmail()
  emergency_contact_email?: string;
}

export class SubmitChildrenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildDetailDto)
  children!: ChildDetailDto[];
}
