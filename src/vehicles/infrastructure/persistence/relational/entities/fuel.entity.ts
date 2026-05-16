// vehicle/infrastructure/persistence/relational/entities/vehicle.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity()
export class FuelEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal')
  amount!: number;

  @Column()
  receipt_url!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  fuel_pump_url!: string | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes!: string | null;

  @CreateDateColumn()
  fuel_date!: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.fuelLogs)
  vehicle!: VehicleEntity;
}
