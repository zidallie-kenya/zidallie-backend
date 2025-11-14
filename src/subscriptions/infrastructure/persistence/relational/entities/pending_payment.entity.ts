import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentModel = 'daily' | 'term' | 'zidallie';
export type PaymentType =
  | 'initial'
  | 'installment'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'termly';

@Entity('pending_payments')
export class PendingPaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  studentId: number;

  @Column({ type: 'int', nullable: true })
  termId: number | null;

  @Column({ nullable: true })
  subscriptionPlanId: number;

  @Column('float')
  amount: number;

  @Column({ unique: true })
  checkoutId: string;

  @Column({ type: 'text', nullable: true })
  phoneNumber: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['initial', 'installment', 'daily', 'weekly', 'monthly', 'termly'],
    nullable: true,
  })
  paymentType: PaymentType | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['daily', 'term', 'zidallie'],
    nullable: true,
  })
  paymentModel: PaymentModel | null;

  @Column({ type: 'int', nullable: true })
  schoolId: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
