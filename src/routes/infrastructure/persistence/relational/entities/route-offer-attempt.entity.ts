import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RouteOfferEntity } from './route-offer.entity';

export type RouteOfferAttemptResponse =
  | 'pending'
  | 'accepted'
  // Explicit decline from the driver.
  | 'declined'
  // Route was accepted by someone else in the same batch while this one
  // was still pending — pushed as "no longer available" rather than left
  // to dangle silently.
  | 'superseded'
  // This driver's accept came in, but the single-driver re-solve run at
  // that moment came back infeasible for them (e.g. a last-minute
  // schedule change). Functionally a decline, tagged separately for
  // debugging/audit.
  | 'infeasible_on_accept';

@Entity('route_offer_attempt')
export class RouteOfferAttemptEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => RouteOfferEntity, (o) => o.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_offer_id' })
  route_offer!: RouteOfferEntity;

  @Column()
  route_offer_id!: number;

  @Column()
  driver_id!: number;

  @Column()
  vehicle_id!: number;

  @Column({ type: 'timestamptz' })
  pushed_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  responded_at?: Date | null;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'accepted',
      'declined',
      'superseded',
      'infeasible_on_accept',
    ],
    default: 'pending',
  })
  response!: RouteOfferAttemptResponse;

  @CreateDateColumn()
  created_at!: Date;
}
