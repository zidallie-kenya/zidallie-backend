// ride/infrastructure/persistence/relational/entities/ride.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { RideSchedule } from '../../../../../utils/types/ride-schedule';
import { RideStatus } from '../../../../../utils/types/enums';
import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';

@Entity({ name: 'ride' })
export class RideEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.rides, {
    nullable: true,
  })
  vehicle: VehicleEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.driver_rides, { nullable: true })
  driver: UserEntity | null;

  @ManyToOne(() => SchoolEntity, (school) => school.rides, { nullable: true })
  school: SchoolEntity | null;

  @ManyToOne(() => StudentEntity, (student) => student.rides, {
    nullable: true,
  })
  student: StudentEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.parent_rides, { nullable: true })
  parent: UserEntity | null;

  @Column({ type: 'jsonb', nullable: true })
  schedule: RideSchedule | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'text', nullable: true })
  admin_comments: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: any | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', length: 20, enum: RideStatus, nullable: false })
  status: RideStatus;

  @OneToMany(() => DailyRideEntity, (daily_ride) => daily_ride.ride)
  daily_rides: DailyRideEntity[];
}
