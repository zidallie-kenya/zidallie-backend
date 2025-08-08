import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { AuthProvidersEnum } from '../../../../../auth/auth-providers.enum';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

export type UserKind = 'Parent' | 'Driver';

export type UserMeta = {
  payments: {
    kind: 'Bank' | 'M-Pesa';
    bank: string | null;
    account_number: string | null;
    account_name: string | null;
  };
  county: string | null;
  neighborhood: string | null;
  notifications: {
    when_bus_leaves: boolean;
    when_bus_makes_home_drop_off: boolean;
    when_bus_make_home_pickup: boolean;
    when_bus_arrives: boolean;
    when_bus_is_1km_away: boolean;
    when_bus_is_0_5km_away: boolean;
  };
};

@Entity({ name: 'user' })
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String, unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Index()
  @Column({ type: String, nullable: true })
  socialId?: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  lastName: string | null;

  // ✅ New: Full name
  @Column({ type: String, nullable: true })
  name: string | null;

  // ✅ New: Phone number
  @Column({ type: String, nullable: true })
  phone_number: string | null;

  // ✅ New: Kind (Parent or Driver)
  @Column({ type: String, nullable: true })
  kind: UserKind;

  // ✅ New: JSON column for meta info
  @Column({ type: 'jsonb', nullable: true })
  meta: UserMeta | null;

  // ✅ New: Wallet balance
  @Column({ type: 'float', default: 0 })
  wallet_balance: number;

  // ✅ New: KYC verification
  @Column({ type: 'boolean', default: false })
  is_kyc_verified: boolean;

  @OneToOne(() => FileEntity, {
    eager: true,
  })
  @JoinColumn()
  photo?: FileEntity | null;

  @ManyToOne(() => RoleEntity, {
    eager: true,
  })
  role?: RoleEntity | null;

  @ManyToOne(() => StatusEntity, {
    eager: true,
  })
  status?: StatusEntity;

  // @Column({ type: String, default: 'Active' })
  // statusText: 'Active' | 'Inactive';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
