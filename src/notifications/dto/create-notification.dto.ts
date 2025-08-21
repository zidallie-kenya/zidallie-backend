import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { NotificationKind, NotificationSection } from '../../utils/types/enums';

export class CreateNotificationDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ type: String, example: '0:1703167055324634%97a4b8d4f9fd7ecd' })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ type: String, example: '0:1703167055324634%97a4b8d4f9fd7ecd' })
  @IsString()
  @IsNotEmpty()
  receiver: string;

  @ApiProperty({ type: String, example: 'Ride Confirmed' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    type: String,
    example:
      "Your child's ride for tomorrow has been confirmed. Driver will arrive at 7:00 AM.",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ type: Object, required: false, nullable: true })
  @IsOptional()
  meta?: any;

  @ApiProperty({ type: Boolean, example: false })
  @IsBoolean()
  @IsOptional()
  is_read?: boolean = false;

  @ApiProperty({ enum: NotificationKind, example: NotificationKind.Personal })
  @IsEnum(NotificationKind)
  kind: NotificationKind;

  @ApiProperty({
    enum: NotificationSection,
    example: NotificationSection.Rides,
  })
  @IsEnum(NotificationSection)
  section: NotificationSection;
}
