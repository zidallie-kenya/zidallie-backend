import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CarpoolSchoolEntity } from './carpool-school.entity';
import { BusSchoolEntity } from './bus-school.entity';
import { PickupStationEntity } from './pickup-station.entity';
import { ClusterEntity } from './cluster.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BookingDepositEntity } from './booking-deposit.entity';
import { BookingChildEntity } from './booking-child.entity';

export type BookingServiceType = 'carpool' | 'bus';
export type BookingTerm = 'dec-jan' | 'apr-may' | 'aug-sept';
export type BookingTripType = 'one_way' | 'two_way';
export type BookingStatus =
  | 'pending' // form started, not submitted
  | 'awaiting_cluster' // submitted, waitlisted
  | 'deposit_pending' // cluster active, awaiting payment
  | 'deposit_paid' // deposit paid
  | 'completed' // all done
  | 'cancelled'
  | 'refunded';

@Entity({ name: 'transport_booking' })
export class BookingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'parent_id' })
  parent!: UserEntity;

  @Column({ type: 'varchar', length: 10 })
  service_type!: BookingServiceType;

  @Column({ type: 'varchar', length: 20 })
  term!: BookingTerm;

  @Column({ type: 'varchar', length: 10, default: 'two_way' })
  trip_type!: BookingTripType;

  @Column({ type: 'int', default: 1 })
  children_count!: number;

  // Carpool fields
  @ManyToOne(() => CarpoolSchoolEntity, { nullable: true })
  @JoinColumn({ name: 'carpool_school_id' })
  carpool_school!: CarpoolSchoolEntity | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  home_area!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 8, nullable: true })
  home_lat!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 8, nullable: true })
  home_lon!: number | null;

  // Bus fields
  @ManyToOne(() => BusSchoolEntity, { nullable: true })
  @JoinColumn({ name: 'bus_school_id' })
  bus_school!: BusSchoolEntity | null;

  @ManyToOne(() => PickupStationEntity, { nullable: true })
  @JoinColumn({ name: 'pickup_station_id' })
  pickup_station!: PickupStationEntity | null;

  // Pricing
  @Column({ type: 'varchar', length: 100, nullable: true })
  region!: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  distance_km!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_per_child!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_price!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  deposit_amount!: number | null; // 3000 * children_count

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balance_amount!: number | null;

  // Cluster
  @ManyToOne(() => ClusterEntity, (cluster) => cluster.bookings, {
    nullable: true,
  })
  @JoinColumn({ name: 'cluster_id' })
  cluster!: ClusterEntity | null;

  @Column({ type: 'boolean', default: true })
  is_waitlisted!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_paid!: number;

  @Column({ type: 'timestamp', nullable: true })
  waitlist_started_at!: Date | null;

  @OneToMany(() => BookingChildEntity, (child) => child.booking, {
    cascade: true,
  })
  children!: BookingChildEntity[];

  @OneToMany(() => BookingDepositEntity, (deposit) => deposit.booking)
  deposits!: BookingDepositEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
