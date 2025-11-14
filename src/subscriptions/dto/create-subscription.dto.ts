// src/subscriptions/dto/create-subscription.dto.ts
import { IsNumber, IsPhoneNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsNumber()
  student_id: number;

  @IsNumber()
  amount: number;

  @IsPhoneNumber('KE')
  phone_number: string;
}
