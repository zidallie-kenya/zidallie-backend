import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// accept/decline take no body — the driver is identified via your auth
// guard (see the controller snippet), and the route via the URL param.

export class ManualAssignDriverDto {
  @Type(() => Number)
  @IsInt()
  driver_id!: number;

  @Type(() => Number)
  @IsInt()
  vehicle_id!: number;
}
