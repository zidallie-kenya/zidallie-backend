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

@Entity({ name: 'school' })
export class SchoolEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: SchoolMeta | null;

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @OneToMany(() => StudentEntity, (student) => student.school)
  students: StudentEntity[];

  @OneToMany(() => RideEntity, (ride) => ride.school)
  rides: RideEntity[];

  @OneToMany(() => OnboardingFormEntity, (onboarding) => onboarding.school)
  onboardings: OnboardingFormEntity[];
}
