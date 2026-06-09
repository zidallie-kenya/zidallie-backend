import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BookingEntity } from './booking.entity';

export type ReceiptPaymentType =
  | 'deposit'
  | 'partial_deposit'
  | 'balance'
  | 'full_payment';
export type ReceiptServiceType = 'carpool' | 'bus';

@Entity({ name: 'booking_receipt' })
export class BookingReceiptEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  reference!: string; // e.g. REC-482901

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'parent_id' })
  parent!: UserEntity;

  @ManyToOne(() => BookingEntity, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingEntity;

  @Column({ type: 'varchar', length: 50 })
  name!: string; // e.g. 'Deposit', 'Balance Payment', 'Transport Payment'

  @Column({ type: 'varchar', length: 20 })
  term!: string; // 'dec-jan' | 'apr-may' | 'aug-sept'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance_remaining!: number | null;

  @Column({ type: 'varchar', length: 20 })
  payment_type!: ReceiptPaymentType;

  @Column({ type: 'varchar', length: 10 })
  service_type!: ReceiptServiceType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  school_name!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  home_location!: string | null;

  @Column({ type: 'int', nullable: true })
  children_count!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'M-Pesa' })
  payment_method!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mpesa_transaction_id!: string | null; // from M-Pesa callback

  @CreateDateColumn()
  paid_at!: Date;
}
