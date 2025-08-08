import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum KYCField {
  ID = 'id',
  IS_VERIFIED = 'is_verified',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SortKYCDto {
  @ApiProperty({ enum: KYCField })
  @IsString()
  @IsEnum(KYCField)
  field: KYCField;

  @ApiProperty({ enum: SortDirection })
  @IsString()
  @IsEnum(SortDirection)
  direction: SortDirection;
}
