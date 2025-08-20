import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationKind, NotificationSection } from '../../utils/types/enums';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class FilterNotificationDto {
  @ApiPropertyOptional({ type: Number, description: 'Filter by Receiver ID' })
  userId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by Sender ID' })
  senderId?: number;

  @ApiPropertyOptional({ type: Boolean, description: 'Filter by read status' })
  is_read?: boolean;

  @ApiPropertyOptional({
    enum: NotificationKind,
    description: 'Filter by notification kind',
  })
  kind?: NotificationKind;

  @ApiPropertyOptional({
    enum: NotificationSection,
    description: 'Filter by notification section',
  })
  section?: NotificationSection;
}

export class SortNotificationDto {
  @ApiProperty({ description: 'Field to order by', example: 'created_at' })
  orderBy: string;

  @ApiProperty({
    description: 'Order direction',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  order: 'ASC' | 'DESC';
}

export class QueryNotificationsDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10, maximum: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ type: FilterNotificationDto })
  @ValidateNested()
  @Type(() => FilterNotificationDto)
  @IsOptional()
  filters?: FilterNotificationDto;

  @ApiPropertyOptional({ type: [SortNotificationDto] })
  @ValidateNested({ each: true })
  @Type(() => SortNotificationDto)
  @IsOptional()
  sort?: SortNotificationDto[];
}
