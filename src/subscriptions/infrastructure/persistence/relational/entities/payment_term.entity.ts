import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { TermCommissionEntity } from './term_commission.entity';
import { StudentPaymentEntity } from './student_payment.entity';
import { SchoolDisbursementEntity } from './school_disbursement.entity';

@Entity({ name: 'payment_terms' })
export class PaymentTermEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SchoolEntity, { nullable: true })
  school: SchoolEntity | null;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'date', nullable: false })
  start_date: Date;

  @Column({ type: 'date', nullable: false })
  end_date: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TermCommissionEntity, (commission) => commission.term)
  term_commissions: TermCommissionEntity[];

  @OneToMany(() => StudentPaymentEntity, (payment) => payment.term)
  student_payments: StudentPaymentEntity[];

  @OneToMany(
    () => SchoolDisbursementEntity,
    (disbursement) => disbursement.term,
  )
  school_disbursements: SchoolDisbursementEntity[];
}
