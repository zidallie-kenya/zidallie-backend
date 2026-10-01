import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RouteEntity } from './route.entity';
import { RouteOfferAttemptEntity } from './route-offer-attempt.entity';

export type RouteOfferStatus =
  | 'pending' // one or more batches pushed, awaiting a response
  | 'accepted' // a driver accepted — see accepted_driver_id
  | 'no_driver_found' // ran out of candidates, or hit the 24hr cap
  | 'cancelled'; // route was cancelled/reassigned out from under the cascade

export interface RouteOfferCandidate {
  driver_id: number;
  vehicle_id: number;
  // Distance from the driver's home to the route's first stop
  // (sequence_order = 1), computed once when the cascade starts.
  distance_km: number;
}

@Entity('route_offer')
export class RouteOfferEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => RouteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route!: RouteEntity;

  @Column()
  route_id!: number;

  // Full ranked list, nearest-to-first-stop first. Batches are just
  // consecutive slices of this — [0,10), [10,20), etc.
  @Column({ type: 'jsonb' })
  candidates!: RouteOfferCandidate[];

  // Index of the first candidate in the currently-outstanding batch. A
  // batch is "resolved" (all declined, or nobody left to ask) before this
  // ever advances — see RouteOfferService.maybeAdvanceBatch.
  @Column({ default: 0 })
  current_batch_start_index!: number;

  @Column({ type: 'timestamptz', nullable: true })
  current_batch_pushed_at?: Date | null;

  @Column({ type: 'timestamptz' })
  cascade_started_at!: Date;

  // Rule 2 — "if within 24 hours, no one picks, admin now assigns". Hard
  // cap independent of how many batches get tried.
  @Column({ type: 'timestamptz' })
  cascade_deadline_at!: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'no_driver_found', 'cancelled'],
    default: 'pending',
  })
  status!: RouteOfferStatus;

  @Column({ type: 'int', nullable: true })
  accepted_driver_id?: number | null;

  @Column({ type: 'int', nullable: true })
  accepted_vehicle_id?: number | null;

  @OneToMany(() => RouteOfferAttemptEntity, (a) => a.route_offer)
  attempts!: RouteOfferAttemptEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
