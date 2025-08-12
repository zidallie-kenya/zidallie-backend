import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export type UserKind = 'Parent' | 'Driver' | 'Admin';

export class UserDto {
  @ApiProperty({
    type: String,
    example: 'userId',
  })
  @IsNotEmpty()
  id: string | number;
}

// 👇 Payments DTO
export class PaymentsDto {
  @ApiProperty({ enum: ['Bank', 'M-Pesa'] })
  @IsEnum(['Bank', 'M-Pesa'])
  kind: 'Bank' | 'M-Pesa';

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  bank: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  account_number: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  account_name: string | null;
}

// 👇 Notifications DTO
export class NotificationsDto {
  @ApiProperty()
  @IsBoolean()
  when_bus_leaves: boolean;

  @ApiProperty()
  @IsBoolean()
  when_bus_makes_home_drop_off: boolean;

  @ApiProperty()
  @IsBoolean()
  when_bus_make_home_pickup: boolean;

  @ApiProperty()
  @IsBoolean()
  when_bus_arrives: boolean;

  @ApiProperty()
  @IsBoolean()
  when_bus_is_1km_away: boolean;

  @ApiProperty()
  @IsBoolean()
  when_bus_is_0_5km_away: boolean;
}

// 👇 Final Meta DTO
export class UserMetaDto {
  @ApiProperty({ type: () => PaymentsDto })
  @ValidateNested()
  @Type(() => PaymentsDto)
  payments: PaymentsDto;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  county: string | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  neighborhood: string | null;

  @ApiProperty({ type: () => NotificationsDto })
  @ValidateNested()
  @Type(() => NotificationsDto)
  notifications: NotificationsDto;
}
