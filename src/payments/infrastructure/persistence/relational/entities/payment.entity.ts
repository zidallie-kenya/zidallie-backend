// payment/infrastructure/persistence/relational/entities/payment.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PaymentKind, TransactionType } from '../../../../../utils/types/enums';

@Entity({ name: 'payment' })
export class PaymentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.payments, { nullable: false })
  user: UserEntity;

  @Column({ type: 'float', nullable: false })
  amount: number;

  @Column({ type: 'varchar', length: 10, enum: PaymentKind, nullable: false })
  kind: PaymentKind;

  @Column({
    type: 'varchar',
    length: 20,
    enum: TransactionType,
    nullable: false,
  })
  transaction_type: TransactionType;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'text', nullable: true })
  transaction_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
