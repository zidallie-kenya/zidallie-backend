import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { PaymentTermEntity } from './payment_term.entity';
import { StudentPaymentEntity } from './student_payment.entity';

export type DisbursementType = 'B2C' | 'B2B';
export type DisbursementStatus = 'pending' | 'completed' | 'failed';

@Entity({ name: 'school_disbursements' })
export class SchoolDisbursementEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StudentEntity, { nullable: false })
  student: StudentEntity;

  @ManyToOne(() => PaymentTermEntity, (term) => term.school_disbursements, {
    nullable: true,
  })
  term: PaymentTermEntity | null;

  @ManyToOne(
    () => StudentPaymentEntity,
    (payment) => payment.school_disbursements,
    { nullable: false },
  )
  payment: StudentPaymentEntity;

  @Column({ type: 'text', nullable: true })
  bank_paybill: string | null;

  @Column({ type: 'text', nullable: true })
  account_number: string | null;

  @Column({ type: 'float', nullable: false })
  amount_disbursed: number;

  @Column({
    type: 'varchar',
    length: 10,
    enum: ['B2C', 'B2B'],
    nullable: false,
  })
  disbursement_type: DisbursementType;

  @Column({ type: 'text', nullable: true })
  transaction_id: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status: DisbursementStatus;

  @CreateDateColumn()
  created_at: Date;
}
