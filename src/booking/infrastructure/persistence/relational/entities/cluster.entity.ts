import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BookingEntity } from './booking.entity';

@Entity({ name: 'transport_cluster' })
export class ClusterEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 100, default: 'General' })
  zone!: string;

  @Column({ type: 'int', default: 7 })
  max_capacity!: number;

  @Column({ type: 'boolean', default: false })
  is_active!: boolean;

  // Which term this cluster belongs to
  @Column({ type: 'varchar', length: 20, nullable: true })
  term!: string | null; // 'dec-jan-2026' | 'apr-may-2026' | 'aug-sept-2026'

  @OneToMany(() => BookingEntity, (booking) => booking.cluster)
  bookings!: BookingEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
