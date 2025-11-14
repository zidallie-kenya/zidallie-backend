// student/infrastructure/persistence/relational/entities/student.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { Gender } from '../../../../../utils/types/enums';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { SubscriptionEntity } from '../../../../../subscriptions/infrastructure/persistence/relational/entities/subscription.entity';

export type ServiceType = 'school' | 'carpool' | 'private';

@Entity({ name: 'student' })
export class StudentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SchoolEntity, (school) => school.students, {
    nullable: true,
  })
  school: SchoolEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.students, { nullable: true })
  parent: UserEntity | null;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  profile_picture: string | null;

  @Column({ type: 'varchar', length: 6, enum: Gender, nullable: false })
  gender: Gender;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: any | null;

  // NEW FIELDS FOR PAYMENT INTEGRATION
  @Column({ type: 'text', nullable: true })
  account_number: string | null;

  @Column({ type: 'float', nullable: true })
  daily_fee: number | null;

  @Column({ type: 'float', nullable: true })
  transport_term_fee: number | null;

  @Column({
    type: 'varchar',
    length: 10,
    enum: ['school', 'carpool', 'private'],
    nullable: true,
  })
  service_type: ServiceType | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => RideEntity, (ride) => ride.student)
  rides: RideEntity[];

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.student)
  subscriptions?: SubscriptionEntity[];
}
