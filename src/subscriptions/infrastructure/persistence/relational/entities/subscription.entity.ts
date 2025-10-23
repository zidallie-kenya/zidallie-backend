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
