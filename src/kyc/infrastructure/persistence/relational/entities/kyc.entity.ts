import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'kyc' })
export class KYCEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  national_id_front: string | null;

  @Column({ type: 'varchar', nullable: true })
  national_id_back: string | null;

  @Column({ type: 'varchar', nullable: true })
  passport_photo: string | null;

  @Column({ type: 'varchar', nullable: true })
  driving_license: string | null;

  @Column({ type: 'varchar', nullable: true })
  certificate_of_good_conduct: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  comments: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @OneToOne(() => UserEntity, (user) => user.kyc, {
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  user: UserEntity | null;
}
