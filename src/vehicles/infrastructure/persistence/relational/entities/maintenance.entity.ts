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
export class MaintenanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mileage: number; // You called it "mirage", usually referred to as "mileage"

  @Column('decimal')
  cost: number;

  @Column()
  receipt_url: string;

  @CreateDateColumn()
  maintenance_date: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.maintenanceLogs)
  vehicle: VehicleEntity;
}
