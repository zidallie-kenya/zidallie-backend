// student/infrastructure/persistence/relational/entities/student.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { Gender } from '../../../../../utils/types/enums';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';

@Entity({ name: 'student' })
export class StudentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => SchoolEntity, { nullable: true })
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

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => RideEntity, (ride) => ride.student)
  rides: RideEntity[];
}
