// src/subscriptions/dto/create-subscription.dto.ts
import { IsNotEmpty, IsNumber, IsPhoneNumber } from 'class-validator';

export class CreateSubscriptionDto {
    @IsNumber()
    student_id: number;

    @IsNumber()
    amount: number;

    @IsPhoneNumber('KE') // assuming Kenyan phone numbers
    phone_number: string;
}
