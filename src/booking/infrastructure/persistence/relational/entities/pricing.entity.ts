import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'transport_pricing' })
export class PricingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  region!: string;

  @Column({ type: 'varchar', length: 10 }) // 'carpool' | 'bus'
  service_type!: string;

  @Column({ type: 'varchar', length: 20 }) // e.g. "0-5", "5-10"
  distance_range!: string;

  @Column({ type: 'int' })
  max_km!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
