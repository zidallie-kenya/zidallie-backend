// transport-booking-child.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BookingEntity } from './booking.entity';

export enum EmergencyContactRole {
  CLASS_TEACHER = 'class_teacher',
  TRANSPORT_MANAGER = 'transport_manager',
  DIRECTOR = 'director',
  SCHOOL_SECRETARY = 'school_secretary',
}

@Entity({ name: 'transport_booking_child' })
export class BookingChildEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => BookingEntity, (booking) => booking.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking!: BookingEntity;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  grade_class!: string | null;

  @Column({ type: 'time', nullable: true })
  pickup_time!: string | null;

  @Column({ type: 'time', nullable: true })
  dropoff_time!: string | null;

  @Column({
    type: 'enum',
    enum: EmergencyContactRole,
    default: EmergencyContactRole.CLASS_TEACHER,
  })
  emergency_contact!: string;

  @Column({ type: 'varchar', length: 20 })
  emergency_contact_phone!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergency_contact_email!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
