import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SubscriptionPlan {
  @ApiProperty({ type: Number })
  @Expose()
  id: number;

  @ApiProperty({ type: Number })
  @Expose()
  school_id: number; // links to school

  @ApiProperty({ type: String, example: 'Basic' })
  @Expose()
  name: string;

  @ApiProperty({
    type: String,
    example: 'Basic monthly subscription plan',
    required: false,
    nullable: true,
  })
  @Expose()
  description?: string | null;

  @ApiProperty({ type: Number, example: 500 })
  @Expose()
  price: number;

  @ApiProperty({ type: Number, example: 500 })
  @Expose()
  commission_amount: number;

  @ApiProperty({ type: Number, example: 30 })
  @Expose()
  duration_days: number;

  @ApiProperty({ type: Boolean, example: true })
  @Expose()
  is_active: boolean;

  @ApiProperty({ type: Date })
  @Expose()
  created_at: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at: Date;
}
