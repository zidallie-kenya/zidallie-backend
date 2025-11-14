import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { SubscriptionPlanEntity } from './subscription_plans.entity';
import { PaymentTermEntity } from './payment_term.entity';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  expiry_date: Date;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  // NEW COLUMNS
  @ManyToOne(() => PaymentTermEntity, { nullable: true })
  @JoinColumn({ name: 'term_id' })
  term: PaymentTermEntity | null;

  @Column({ type: 'float', default: 0 })
  total_paid: number;

  @Column({ type: 'float', default: 0 })
  balance: number;

  @Column({ type: 'boolean', default: false })
  is_commission_paid: boolean;

  @Column({ type: 'int', nullable: true })
  days_access: number | null;

  @Column({ type: 'timestamp', nullable: true })
  last_payment_date: Date | null;

  @ManyToOne(() => StudentEntity, (student) => student.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: StudentEntity;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.subscriptions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlanEntity | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
