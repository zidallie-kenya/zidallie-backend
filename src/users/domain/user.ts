import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { UserMetaDto } from '../dto/user.dto';

export type UserKind = 'Parent' | 'Driver';

export class User {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, example: 'john.doe@example.com' })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({ type: String, example: 'email' })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({ type: String, example: '1234567890' })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({ type: String, example: 'John' })
  @Expose({ groups: ['me', 'admin'] })
  firstName: string | null;

  @ApiProperty({ type: String, example: 'Doe' })
  @Expose({ groups: ['me', 'admin'] })
  lastName: string | null;

  @ApiProperty({ type: String, example: 'John Doe' })
  @Expose({ groups: ['me', 'admin'] })
  name: string | null;

  @ApiProperty({ type: String, example: '+254712345678' })
  @Expose({ groups: ['me', 'admin'] })
  phone_number: string | null;

  @ApiProperty({ enum: ['Parent', 'Driver'] })
  @Expose({ groups: ['me', 'admin'] })
  kind: UserKind;

  @ApiProperty({ type: () => UserMetaDto, required: false })
  @Expose({ groups: ['me', 'admin'] })
  meta: UserMetaDto | null;

  @ApiProperty({ type: Number, example: 250.0 })
  @Expose({ groups: ['me', 'admin'] })
  wallet_balance: number;

  @ApiProperty({ type: Boolean })
  @Expose({ groups: ['me', 'admin'] })
  is_kyc_verified: boolean;

  @ApiProperty({ type: () => FileType, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  photo?: FileType | null;

  @ApiProperty({ type: () => Role })
  @Expose({ groups: ['me', 'admin'] })
  role?: Role | null;

  @ApiProperty({ type: () => Status })
  @Expose({ groups: ['me', 'admin'] })
  status?: Status;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  updated_at: Date;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  deleted_at: Date;
}
