import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Vehicle } from '../../vehicles/domain/vehicles';
import { User } from '../../users/domain/user';
import { School } from '../../schools/domain/schools';
import { Student } from '../../students/domain/student';
import { RideStatus } from '../../utils/types/enums';
import { DailyRide } from '../../daily_rides/domain/daily_rides';
import { RideScheduleDto } from '../dto/ride-schedule-meta';

export class Ride {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => Vehicle, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  vehicle: Vehicle | null;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  driver: User | null;

  @ApiProperty({ type: () => School, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  school: School | null;

  @ApiProperty({ type: () => Student, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  student: Student | null;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  parent: User | null;

  @ApiProperty({ type: () => RideScheduleDto, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  schedule: RideScheduleDto | null;

  @ApiProperty({
    type: String,
    example: 'Student prefers front seat',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  comments: string | null;

  @ApiProperty({
    type: String,
    example: 'Approved by supervisor',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  admin_comments: string | null;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  meta: any | null;

  @ApiProperty({ enum: RideStatus, example: RideStatus.Requested })
  @Expose({ groups: ['me', 'admin'] })
  status: RideStatus;

  @ApiProperty({ type: () => [DailyRide] })
  @Expose({ groups: ['me', 'admin'] })
  daily_rides: DailyRide[];

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;
}
