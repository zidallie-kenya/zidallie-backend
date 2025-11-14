import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { PaymentTermEntity } from './payment_term.entity';

@Entity({ name: 'term_commissions' })
@Index(['student', 'term'], { unique: true })
export class TermCommissionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StudentEntity, { nullable: false })
  student: StudentEntity;

  @ManyToOne(() => PaymentTermEntity, (term) => term.term_commissions, {
    nullable: false,
  })
  term: PaymentTermEntity;

  @Column({ type: 'float', nullable: false })
  commission_amount: number;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
