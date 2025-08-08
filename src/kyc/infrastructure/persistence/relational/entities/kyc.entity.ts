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

  @Column({ type: String })
  national_id_front: string;

  @Column({ type: String })
  national_id_back: string;

  @Column({ type: String })
  passport_photo: string;

  @Column({ type: String })
  driving_license: string;

  @Column({ type: String })
  certificate_of_good_conduct: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: String })
  comments: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @OneToOne(() => UserEntity, (user) => user.id, {
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  user: UserEntity | null;
}
