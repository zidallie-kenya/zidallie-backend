// daily_ride/infrastructure/persistence/relational/entities/daily_ride.entity.ts
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
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import {
  DailyRideKind,
  DailyRideStatus,
} from '../../../../../utils/types/enums';
import { DailyRideMeta } from '../../../../../utils/types/daily-ride-meta';
import { LocationEntity } from '../../../../../location/infrastructure/persistence/relational/entities/location.entity';

@Entity({ name: 'daily_ride' })
export class DailyRideEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RideEntity, (ride) => ride.daily_rides, { nullable: false })
  ride: RideEntity;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.daily_rides, {
    nullable: false,
  })
  vehicle: VehicleEntity;

  @ManyToOne(() => UserEntity, (user) => user.daily_rides, { nullable: true })
  driver: UserEntity | null;

  @Column({ type: 'varchar', length: 10, enum: DailyRideKind, nullable: false })
  kind: DailyRideKind;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: DailyRideMeta | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'varchar',
    length: 10,
    enum: DailyRideStatus,
    nullable: false,
  })
  status: DailyRideStatus;

  @Column({ type: 'timestamp', nullable: true })
  embark_time: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  disembark_time: Date | null;

  @OneToMany(() => LocationEntity, (location) => location.daily_ride)
  locations: LocationEntity[];
}
