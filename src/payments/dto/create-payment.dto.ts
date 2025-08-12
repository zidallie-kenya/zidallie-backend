import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentKind, TransactionType } from '../../utils/types/enums';

export class CreatePaymentDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ type: Number, example: 1500.0 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: PaymentKind, example: PaymentKind.Bank })
  @IsEnum(PaymentKind)
  kind: PaymentKind;

  @ApiProperty({ enum: TransactionType, example: TransactionType.Deposit })
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @ApiPropertyOptional({
    type: String,
    example: 'Monthly school transport payment',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'TXN123456789',
  })
  @IsOptional()
  @IsString()
  transaction_id?: string;
}
