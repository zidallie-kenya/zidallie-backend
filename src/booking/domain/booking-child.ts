// booking-child.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Student } from '../../students/domain/student'; // adjust path to your actual Student domain model

export class BookingChild {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: Number })
  @Expose()
  booking_id!: number;

  @ApiProperty({ type: () => Student, nullable: true })
  @Expose()
  @Type(() => Student)
  student!: Student | null;

  @ApiProperty({ type: String })
  @Expose()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  grade_class!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  pickup_time!: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  dropoff_time!: string | null;

  @ApiProperty({ example: 'class_teacher' })
  @Expose()
  emergency_contact!: string;

  @ApiProperty()
  @Expose()
  emergency_contact_phone!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  emergency_contact_email!: string | null;

  constructor(partial?: Partial<BookingChild>) {
    Object.assign(this, partial);
  }
}
