import { ApiProperty } from '@nestjs/swagger';

class NotificationsDto {
  @ApiProperty()
  point_five_km: boolean;

  @ApiProperty()
  one_km: boolean;
}

export class DailyRideMetaDto {
  @ApiProperty({ type: () => NotificationsDto })
  notifications: NotificationsDto;
}
