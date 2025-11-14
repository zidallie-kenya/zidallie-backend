import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SchoolMeta } from '../../../../../utils/types/school-meta';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { OnboardingFormEntity } from '../../../../../onboarding/infrastructure/persistence/relational/entities/onboarding.entity';
import { SubscriptionPlanEntity } from '../../../../../subscriptions/infrastructure/persistence/relational/entities/subscription_plans.entity';

export type ServiceType = 'school' | 'carpool' | 'private';

@Entity({ name: 'school' })
export class SchoolEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  disbursement_phone_number: string | null;

  @Column({ type: 'text', nullable: true })
  bank_paybill_number: string | null;

  @Column({ type: 'text', nullable: true })
  bank_account_number: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  terra_email: string | null;

  @Column({ type: 'text', nullable: true })
  terra_password: string | null;

  @Column({ type: 'text', nullable: true })
  terra_tag_id: string | null;

  @Column({ type: 'text', nullable: true })
  terra_zone_tag: string | null;

  @Column({ type: 'text', nullable: true })
  terra_parents_tag: string | null;

  @Column({ type: 'text', nullable: true })
  terra_student_tag: string | null;

  @Column({ type: 'text', nullable: true })
  terra_school_tag: string | null;

  @Column({ type: 'text', nullable: true })
  smart_card_url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: SchoolMeta | null;

  // NEW COLUMNS
  @Column({ type: 'boolean', default: false })
  has_commission: boolean;

  @Column({ type: 'float', nullable: true })
  commission_amount: number | null;

  @Column({ type: 'text', nullable: true })
  paybill: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    enum: ['school', 'carpool', 'private'],
    nullable: true,
  })
  service_type: ServiceType | null;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @OneToMany(() => StudentEntity, (student) => student.school)
  students: StudentEntity[];

  @OneToMany(() => RideEntity, (ride) => ride.school)
  rides: RideEntity[];

  @OneToMany(() => OnboardingFormEntity, (onboarding) => onboarding.school)
  onboardings: OnboardingFormEntity[];

  @OneToMany(() => SubscriptionPlanEntity, (plan) => plan.school)
  subscription_plans?: SubscriptionPlanEntity[];
}
