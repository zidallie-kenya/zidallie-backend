import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { NotificationKind, NotificationSection } from '../../utils/types/enums';

export class Notification {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => User })
  @Expose({ groups: ['me', 'admin'] })
  user: User;

  @ApiProperty({ type: String, example: 'Ride Confirmed' })
  @Expose({ groups: ['me', 'admin'] })
  title: string;

  @ApiProperty({
    type: String,
    example:
      "Your child's ride for tomorrow has been confirmed. Driver will arrive at 7:00 AM.",
  })
  @Expose({ groups: ['me', 'admin'] })
  message: string;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  meta: any | null;

  @ApiProperty({ type: Boolean, example: false })
  @Expose({ groups: ['me', 'admin'] })
  is_read: boolean;

  @ApiProperty({ enum: NotificationKind, example: NotificationKind.Personal })
  @Expose({ groups: ['me', 'admin'] })
  kind: NotificationKind;

  @ApiProperty({
    enum: NotificationSection,
    example: NotificationSection.Rides,
  })
  @Expose({ groups: ['me', 'admin'] })
  section: NotificationSection;

  @ApiProperty()
  @Expose({ groups: ['me', 'admin'] })
  created_at: Date;
}
