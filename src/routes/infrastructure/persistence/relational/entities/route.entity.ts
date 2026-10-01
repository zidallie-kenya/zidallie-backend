// routes/infrastructure/persistence/relational/entities/route.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { RouteStopEntity } from './route-stop.entity';
import { BookingTerm } from '../../../../../booking/infrastructure/persistence/relational/entities/booking.entity';
import { CarpoolSchoolEntity } from '../../../../../booking/infrastructure/persistence/relational/entities/carpool-school.entity';
import { BusSchoolEntity } from '../../../../../booking/infrastructure/persistence/relational/entities/bus-school.entity';

export type RouteStatus =
  | 'draft' // just solved, nobody's looked at it
  | 'flagged' // solver couldn't place these students — needs manual admin call
  | 'approved' // admin approved, rides not yet created
  | 'active' // rides created, running today
  | 'completed'
  | 'cancelled';

export type RouteKind = 'pickup' | 'dropoff';
export type RouteServiceType = 'carpool' | 'bus';

// Everything ever written into RouteEntity.meta, gathered in one place so
// every writer (RouteSolveProcessor, RoutesService, RouteOfferService,
// FlaggedRoutesAdminService) stays type-checked against the same shape
// instead of each reaching for `as any`.
export interface RouteMeta {
  polyline?: string; // encoded route geometry for map display
  solver_run_id?: string; // ties this route back to the batch solve that produced it
  flagged_reason?: string; // e.g. "no driver within 10km", "no cluster fit"
  replaced_route_id?: number; // set when this route exists because of a driver reassignment mid-term

  // RouteOfferService.exhaustCascade — cascade ran out of candidates or
  // hit the 24hr cap; route needs an admin to manually assign a driver.
  needs_manual_driver_assignment?: boolean;
  cascade_exhausted_reason?: string;

  // FlaggedRoutesAdminService.assignGroupDriver — this route was created
  // by merging flagged single-student routes by hand.
  admin_grouped?: boolean;
  source_flagged_route_ids?: number[];
  // FlaggedRoutesAdminService.assignGroupDriver — set on the superseded
  // originals, pointing at the new merged route.
  superseded_by_route_id?: number;
}

@Entity({ name: 'route' })
export class RouteEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  term!: BookingTerm; // 'dec-jan' | 'apr-may' | 'aug-sept' — which term's roster this route was solved against

  @Column({ type: 'varchar', length: 10 })
  service_type!: RouteServiceType;

  @Column({ type: 'varchar', length: 10 })
  kind!: RouteKind; // pickup (home->school) or dropoff (school->home) — solved as two separate directed routes, never one round trip

  @Index()
  @Column({ type: 'date' })
  trip_date!: Date; // the specific weekday this route instance covers (routes are re-materialized per school day from the term's solved pattern, same as daily_ride today)

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver!: UserEntity | null; // nullable while status = 'flagged' and no driver could be matched, or while a route sits in the offer cascade awaiting acceptance

  @ManyToOne(() => VehicleEntity, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: VehicleEntity | null;

  // Exactly one of these is set, matching service_type
  @ManyToOne(() => CarpoolSchoolEntity, { nullable: true })
  @JoinColumn({ name: 'carpool_school_id' })
  carpool_school!: CarpoolSchoolEntity | null;

  @ManyToOne(() => BusSchoolEntity, { nullable: true })
  @JoinColumn({ name: 'bus_school_id' })
  bus_school!: BusSchoolEntity | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: RouteStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  total_distance_km!: number | null;

  @Column({ type: 'int', nullable: true })
  total_duration_minutes!: number | null; // from the solver — used to enforce the 60-minute max trip rule

  @Column({ type: 'time', nullable: true })
  route_start_time!: string | null; // when the driver must leave the start point (driver's home for pickup, school for dropoff)

  @Column({ type: 'time', nullable: true })
  route_end_time!: string | null; // arrival at school (pickup) or last child's home (dropoff)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  trip_amount!: number | null; // what's shown to the driver — derived from per-child pricing on the underlying bookings, summed

  // Snapshot of the driver's start coordinates used for THIS solve — home
  // location normally, but overwritten with a live GPS ping when a route is
  // re-solved after a mid-term driver swap ("they get new stops from their
  // current location").
  @Column({ type: 'decimal', precision: 15, scale: 8, nullable: true })
  origin_latitude!: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 8, nullable: true })
  origin_longitude!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: RouteMeta | null;

  @OneToMany(() => RouteStopEntity, (stop) => stop.route, { cascade: true })
  stops!: RouteStopEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
