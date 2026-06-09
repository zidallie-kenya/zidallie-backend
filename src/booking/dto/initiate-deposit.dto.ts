import { IsNumber, IsString, Min } from 'class-validator';

export class InitiateDepositDto {
  @IsString()
  phone_number!: string;

  @IsNumber()
  @Min(1)
  amount!: number;
}
