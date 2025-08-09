// vehicle/infrastructure/persistence/relational/entities/vehicle.entity.ts
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
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { VehicleStatus, VehicleType } from '../../../../../utils/types/enums';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';

@Entity({ name: 'vehicle' })
export class VehicleEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.vehicles, { nullable: true })
  user: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  vehicle_name: string | null;

  @Column({ type: 'text', nullable: false })
  registration_number: string;

  @Column({ type: 'varchar', length: 10, enum: VehicleType, nullable: false })
  vehicle_type: VehicleType;

  @Column({ type: 'text', nullable: false })
  vehicle_model: string;

  @Column({ type: 'integer', nullable: false })
  vehicle_year: number;

  @Column({ type: 'text', nullable: true })
  vehicle_image_url: string | null;

  @Column({ type: 'integer', nullable: false })
  seat_count: number;

  @Column({ type: 'integer', nullable: false })
  available_seats: number;

  @Column({ type: 'boolean', nullable: false })
  is_inspected: boolean;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: any | null;

  @Column({ type: 'text', nullable: true })
  vehicle_registration: string | null;

  @Column({ type: 'text', nullable: true })
  insurance_certificate: string | null;

  @Column({ type: 'jsonb', nullable: true })
  vehicle_data: any | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({
    type: 'varchar',
    length: 10,
    enum: VehicleStatus,
    nullable: false,
    default: VehicleStatus.Active,
  })
  status: VehicleStatus;

  @OneToMany(() => RideEntity, (ride) => ride.vehicle)
  rides: RideEntity[];

  @OneToMany(() => DailyRideEntity, (dailyRide) => dailyRide.vehicle)
  daily_rides: DailyRideEntity[];
}
