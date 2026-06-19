// src/subscriptions/dto/create-subscription.dto.ts
import { IsBoolean, IsNumber, IsPhoneNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  student_id!: number;

  @IsNumber()
  amount!: number;

  @IsPhoneNumber('KE')
  phone_number!: string;

  @IsBoolean()
  isInstantPayment!: boolean;

  @IsNumber()
  daily_ride_id!: number | null;
}
