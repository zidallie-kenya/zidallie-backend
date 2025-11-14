import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { School } from '../../schools/domain/schools';
import { User } from '../../users/domain/user';
import { Gender } from '../../utils/types/enums';
import { Ride } from '../../rides/domain/rides';
import { Subscription } from '../../subscriptions/domain/subscription';

export type ServiceType = 'school' | 'carpool' | 'private';

export class Student {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => School, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  school: School | null;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  parent: User | null;

  @ApiProperty({ type: String, example: 'Jane Doe' })
  @Expose({ groups: ['me', 'admin'] })
  name: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/profiles/jane.jpg',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  profile_picture: string | null;

  @ApiProperty({ enum: Gender, example: Gender.Female })
  @Expose({ groups: ['me', 'admin'] })
  gender: Gender;

  @ApiProperty({
    type: String,
    example: '123 Karen Road, Nairobi',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  address: string | null;

  @ApiProperty({
    type: String,
    example: 'Allergic to peanuts',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  comments: string | null;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  meta: any | null;

  // 🆕 New Payment Fields
  @ApiProperty({
    type: String,
    example: 'ACC12345',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  account_number: string | null;

  @ApiProperty({
    type: Number,
    example: 500,
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  daily_fee: number | null;

  @ApiProperty({
    type: Number,
    example: 12000,
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  transport_term_fee: number | null;

  @ApiProperty({
    enum: ['school', 'carpool', 'private'],
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  service_type: ServiceType | null;

  @ApiProperty({ type: () => [Ride] })
  @Expose({ groups: ['me', 'admin'] })
  rides: Ride[];

  @ApiProperty({ type: () => [Subscription], required: false })
  @Expose({ groups: ['me', 'admin'] })
  subscriptions?: Subscription[];

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
