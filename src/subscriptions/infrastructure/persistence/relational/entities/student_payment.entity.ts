import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { PaymentTermEntity } from './payment_term.entity';
import { SchoolDisbursementEntity } from './school_disbursement.entity';

export type PaymentType =
  | 'initial'
  | 'installment'
  | 'daily'
  | 'weekly'
  | 'monthly';

@Entity({ name: 'student_payments' })
export class StudentPaymentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StudentEntity, { nullable: false })
  student: StudentEntity;

  @ManyToOne(() => PaymentTermEntity, (term) => term.student_payments, {
    nullable: true,
  })
  term: PaymentTermEntity | null;

  @Column({ type: 'text', nullable: false })
  transaction_id: string;

  @Column({ type: 'text', nullable: false })
  phone_number: string;

  @Column({ type: 'float', nullable: false })
  amount_paid: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['initial', 'installment', 'daily', 'weekly', 'monthly'],
    nullable: false,
  })
  payment_type: PaymentType;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(
    () => SchoolDisbursementEntity,
    (disbursement) => disbursement.payment,
  )
  school_disbursements: SchoolDisbursementEntity[];
}
