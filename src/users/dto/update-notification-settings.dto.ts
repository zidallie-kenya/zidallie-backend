import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_leaves?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_makes_home_drop_off?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_make_home_pickup?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_arrives?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_is_1km_away?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  when_bus_is_0_5km_away?: boolean;
}
