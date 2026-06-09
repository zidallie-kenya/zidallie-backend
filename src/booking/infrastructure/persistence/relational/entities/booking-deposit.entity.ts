import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingEntity } from './booking.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

export type DepositStatus = 'pending' | 'paid' | 'failed' | 'refunded';

@Entity({ name: 'transport_booking_deposit' })
export class BookingDepositEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => BookingEntity, (booking) => booking.deposits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'parent_id' })
  parent!: UserEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 20 })
  phone_number!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  checkout_request_id!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: DepositStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mpesa_transaction_id!: string | null;

  @Column({ type: 'varchar', length: 20 })
  payment_type!: string; // 'deposit' | 'full'

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
