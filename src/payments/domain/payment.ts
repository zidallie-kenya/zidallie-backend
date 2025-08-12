import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { PaymentKind, TransactionType } from '../../utils/types/enums';

export class Payment {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => User })
  @Expose({ groups: ['me', 'admin'] })
  user: User;

  @ApiProperty({ type: Number, example: 1500.0 })
  @Expose({ groups: ['me', 'admin'] })
  amount: number;

  @ApiProperty({ enum: PaymentKind, example: PaymentKind.Bank })
  @Expose({ groups: ['me', 'admin'] })
  kind: PaymentKind;

  @ApiProperty({ enum: TransactionType, example: TransactionType.Deposit })
  @Expose({ groups: ['me', 'admin'] })
  transaction_type: TransactionType;

  @ApiProperty({
    type: String,
    example: 'Monthly school transport payment',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  comments: string | null;

  @ApiProperty({
    type: String,
    example: 'TXN123456789',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  transaction_id: string | null;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;
}
