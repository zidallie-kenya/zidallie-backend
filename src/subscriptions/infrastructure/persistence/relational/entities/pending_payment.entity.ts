import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pending_payments')
export class PendingPaymentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studentId: number; // store only the ID, no relation

  @Column('float')
  amount: number;

  @Column({ unique: true })
  checkoutId: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
