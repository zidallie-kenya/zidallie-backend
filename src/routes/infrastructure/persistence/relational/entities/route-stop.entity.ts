// routes/infrastructure/persistence/relational/entities/route-stop.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RouteEntity, RouteKind } from './route.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { BookingChildEntity } from '../../../../../booking/infrastructure/persistence/relational/entities/booking-child.entity';
import { PickupStationEntity } from '../../../../../booking/infrastructure/persistence/relational/entities/pickup-station.entity';

export type RouteStopStatus =
  | 'pending'
  | 'en_route' // driver is between the previous stop and this one
  | 'completed'
  | 'skipped' // driver marked absent, or admin removed after approval
  | 'no_show';

@Entity({ name: 'route_stop' })
@Index(['route', 'sequence_order'], { unique: true }) // no two stops share a slot on the same route
export class RouteStopEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => RouteEntity, (route) => route.stops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_id' })
  route!: RouteEntity;

  // Set for carpool stops (per-student home). Null for bus stops, where the
  // stop is a shared pickup_station instead.
  @ManyToOne(() => StudentEntity, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student!: StudentEntity | null;

  // Links back to the specific term booking this stop was solved from —
  // needed because pickup/dropoff *time* and the emergency contact used for
  // this stop come from BookingChildEntity, not the persistent StudentEntity.
  @ManyToOne(() => BookingChildEntity, { nullable: true })
  @JoinColumn({ name: 'booking_child_id' })
  booking_child!: BookingChildEntity | null;

  // Set for bus stops instead of student — one stop per station, shared by
  // every child who picked that station.
  @ManyToOne(() => PickupStationEntity, { nullable: true })
  @JoinColumn({ name: 'pickup_station_id' })
  pickup_station!: PickupStationEntity | null;

  @Column({ type: 'int' })
  sequence_order!: number; // 1-indexed position in the driver's stop list

  @Column({ type: 'varchar', length: 10 })
  kind!: RouteKind; // denormalized from route.kind for quick filtering/display

  // Coordinates are snapshotted at solve time (not read live from the
  // student/station each time) so a route already approved doesn't silently
  // shift if someone edits an address afterwards — a change requires a
  // re-solve, not a live join.
  @Column({ type: 'decimal', precision: 15, scale: 8 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 15, scale: 8 })
  longitude!: number;

  @Column({ type: 'text', nullable: true })
  address_label!: string | null; // display string for the driver app

  @Column({ type: 'time' })
  time_window_start!: string; // earliest acceptable arrival, from booking_child.pickup_time/dropoff_time minus buffer

  @Column({ type: 'time' })
  time_window_end!: string; // latest acceptable arrival

  @Column({ type: 'timestamptz', nullable: true })
  estimated_arrival!: Date | null; // solver output — this trip_date + solved offset

  @Column({ type: 'timestamptz', nullable: true })
  actual_arrival!: Date | null; // filled in by the driver app when marked present/absent (mirrors today's present/absent action)

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status!: RouteStopStatus;

  @Column({ type: 'int', nullable: true })
  distance_from_previous_m!: number | null; // for the driver app's "next stop" card

  @Column({ type: 'int', nullable: true })
  duration_from_previous_s!: number | null;

  @CreateDateColumn()
  created_at!: Date;
}
