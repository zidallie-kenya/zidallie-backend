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
  id: number;

  @Column('decimal')
  amount: number;

  @Column()
  receipt_url: string;

  @CreateDateColumn()
  fuel_date: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.fuelLogs)
  vehicle: VehicleEntity;
}
