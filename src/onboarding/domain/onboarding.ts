import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, RideType } from '../../utils/types/enums';
import { School } from '../../schools/domain/schools';

export class Onboarding {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, example: 'John Doe' })
  @Expose({ groups: ['me', 'admin'] })
  parent_name: string;

  @ApiProperty({
    type: String,
    example: 'parent@example.com',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  parent_email: string | null;

  @ApiProperty({
    type: String,
    example: '+254712345678',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  parent_phone: string | null;

  @ApiProperty({
    type: String,
    example: '123 Main Street, Nairobi',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  address: string | null;

  @ApiProperty({ type: String, example: 'Jane Doe' })
  @Expose({ groups: ['me', 'admin'] })
  student_name: string;

  @ApiProperty({ enum: Gender, example: Gender.Female })
  @Expose({ groups: ['me', 'admin'] })
  student_gender: Gender;

  @ApiProperty({ type: () => School })
  @Expose({ groups: ['me', 'admin'] })
  school: School;

  @ApiProperty({ enum: RideType, example: RideType.PickupAndDropoff })
  @Expose({ groups: ['me', 'admin'] })
  ride_type: RideType;

  @ApiProperty({
    type: String,
    example: 'Westlands Shopping Center',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  pickup: string | null;

  @ApiProperty({
    type: String,
    example: 'Karen Shopping Center',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  dropoff: string | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  start_date: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  mid_term: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  end_date: Date | null;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
