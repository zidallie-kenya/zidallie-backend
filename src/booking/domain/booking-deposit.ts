import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BookingDeposit {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: Number })
  @Expose()
  booking_id!: number;

  @ApiProperty({ type: Number })
  @Expose()
  parent_id!: number;

  @ApiProperty({ type: Number })
  @Expose()
  amount!: number;

  @ApiProperty({ type: String })
  @Expose()
  phone_number!: string;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  checkout_request_id!: string | null;

  @ApiProperty({ type: String })
  @Expose()
  status!: string;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  mpesa_transaction_id!: string | null;

  @ApiProperty({ type: String })
  @Expose()
  payment_type!: string;

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;

  constructor(partial?: Partial<BookingDeposit>) {
    Object.assign(this, partial);
  }
}
