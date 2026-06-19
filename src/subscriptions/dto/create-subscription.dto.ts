// src/subscriptions/dto/create-subscription.dto.ts
import { IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  student_id!: number;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  // This Regex allows +254 followed by 7 or 1, and then 8 digits
  @Matches(/^(\+254|254)[17]\d{8}$/, {
    message:
      'phone_number must be a valid Kenyan phone number (e.g. +2547... or 2547...)',
  })
  phone_number!: string;

  // @IsBoolean()
  // isInstantPayment!: boolean;

  // @IsNumber()
  // daily_ride_id!: number | null;
}
