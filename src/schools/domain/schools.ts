import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Student } from '../../students/domain/student';
import { SchoolMetaDto } from '../dto/school-meta.dto';
import { Ride } from '../../rides/domain/rides';
import { Onboarding } from '../../onboarding/domain/onboarding';
import { IsOptional } from 'class-validator';

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

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
