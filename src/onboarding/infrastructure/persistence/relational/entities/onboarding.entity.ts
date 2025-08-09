// onboarding/infrastructure/persistence/relational/entities/onboarding-form.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { Gender, RideType } from '../../../../../utils/types/enums';

@Entity({ name: 'onboarding' })
export class OnboardingFormEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  parent_name: string;

  @Column({ type: 'text', nullable: true })
  parent_email: string | null;

  @Column({ type: 'text', nullable: true })
  parent_phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: false })
  student_name: string;

  @Column({ type: 'varchar', length: 6, enum: Gender, nullable: false })
  student_gender: Gender;

  @ManyToOne(() => SchoolEntity, (school) => school.onboardings, {
    nullable: false,
  })
  school: SchoolEntity;

  @Column({
    type: 'varchar',
    length: 20,
    enum: RideType,
    nullable: false,
    default: RideType.PickupAndDropoff,
  })
  ride_type: RideType;

  @Column({ type: 'text', nullable: true })
  pickup: string | null;

  @Column({ type: 'text', nullable: true })
  dropoff: string | null;

  @Column({ type: 'date', nullable: true })
  start_date: Date | null;

  @Column({ type: 'date', nullable: true })
  mid_term: Date | null;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
