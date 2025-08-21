import { ApiProperty } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

export class MyNotificationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: UserInfo;

  @ApiProperty()
  sender: string;

  @ApiProperty()
  receiver: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  meta: any;

  @ApiProperty()
  is_read: boolean;

  @ApiProperty()
  kind: string;

  @ApiProperty()
  section: string;
}
