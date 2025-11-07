import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { SchoolMetaDto } from '../dto/school-meta.dto';
import { Ride } from '../../rides/domain/rides';
import { Onboarding } from '../../onboarding/domain/onboarding';
import { IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../../subscriptions/domain/subscription-plan';

export class School {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, example: 'Nairobi Primary School' })
  @Expose({ groups: ['me', 'admin'] })
  name: string;

  @ApiProperty({
    type: String,
    example: 'Westlands, Nairobi',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  location: string | null;

  @ApiProperty({
    type: String,
    example: 'School opens at 7:00 AM',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  @IsOptional()
  comments: string | null;

  @ApiProperty({
    type: String,
    example: 'https://nairobiprimary.ac.ke',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  url: string | null;

  @ApiProperty({
    type: String,
    example: 'https://smartcard.nairobiprimary.ac.ke',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  smart_card_url: string | null;

  @ApiProperty({
    type: String,
    example: '254722222222',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  disbursement_phone_number: string | null;

  @ApiProperty({
    type: String,
    example: '247247',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  bank_paybill_number: string | null;

  @ApiProperty({
    type: String,
    example: '0123243433',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  bank_account_number: string | null;

  @ApiProperty({
    type: String,
    example: 'nairobiprimary@gmail.com',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  terra_email: string | null;

  @ApiProperty({
    type: String,
    example: '@nairobiprimary',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  terra_password: string | null;

  @ApiProperty({
    type: String,
    example: 'hfjltoit56565e5hdjk',
    required: false,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  terra_tag_id: string | null;

  @ApiProperty({ type: () => SchoolMetaDto, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  meta: SchoolMetaDto | null;

  @ApiProperty({ type: () => [Student] })
  @Expose({ groups: ['me', 'admin'] })
  students: Student[];

  @ApiProperty({ type: () => [Ride] })
  @Expose({ groups: ['me', 'admin'] })
  rides: Ride[];

  @ApiProperty({ type: () => [Onboarding] })
  @Expose({ groups: ['me', 'admin'] })
  onboardings: Onboarding[];

  @ApiProperty({ type: () => [SubscriptionPlan], required: false })
  @Expose({ groups: ['me', 'admin'] })
  subscription_plans?: SubscriptionPlan[];

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
