import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { VehicleEntity } from './vehicle.entity';

@Entity({ name: 'vehicle_report' })
export class VehicleReportEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  report_url!: string;

  @Column({ type: 'text' })
  file_name!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.vehicle_report, {
    onDelete: 'CASCADE',
  })
  vehicle!: VehicleEntity;

  // This column allows you to access the ID directly if needed for Kysely/Queries
  @Column()
  vehicleId!: number;
}
