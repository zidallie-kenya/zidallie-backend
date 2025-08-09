import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from '../../users/domain/user';

export class KYC {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  national_id_front: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  national_id_back: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  passport_photo: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  driving_license: string | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  certificate_of_good_conduct: string | null;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;

  @ApiProperty({ type: String })
  @Expose({ groups: ['me', 'admin'] })
  comments: string;

  @ApiProperty({ type: Boolean })
  @Expose({ groups: ['me', 'admin'] })
  is_verified: boolean;

  @ApiProperty({ type: () => User, required: false })
  @Expose({ groups: ['me', 'admin'] })
  user: User | null;
}
