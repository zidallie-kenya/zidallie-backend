import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pickup_station' })
export class PickupStationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
