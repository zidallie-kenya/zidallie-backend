// location/infrastructure/persistence/relational/entities/location.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'location' })
export class LocationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DailyRideEntity, (dailyRide) => dailyRide.locations, {
    nullable: false,
  })
  daily_ride: DailyRideEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  driver: UserEntity;

  @Column({ type: 'float', nullable: false })
  latitude: number;

  @Column({ type: 'float', nullable: false })
  longitude: number;

  @Column({ type: 'timestamp', nullable: false })
  timestamp: Date;

  @CreateDateColumn()
  created_at: Date;
}
