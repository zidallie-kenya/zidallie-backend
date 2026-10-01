// routes/domain/route-stop.ts
import { RouteKind } from './route';

export type RouteStopStatus =
  | 'pending'
  | 'en_route'
  | 'completed'
  | 'skipped'
  | 'no_show';

export class RouteStop {
  id!: number;
  route_id!: number;
  student_id!: number | null;
  booking_child_id!: number | null;
  pickup_station_id!: number | null;

  sequence_order!: number;
  kind!: RouteKind;

  latitude!: number;
  longitude!: number;

  address_label!: string | null;

  time_window_start!: string;
  time_window_end!: string;

  estimated_arrival!: Date | null;
  actual_arrival!: Date | null;

  status!: RouteStopStatus;

  distance_from_previous_m!: number | null;
  duration_from_previous_s!: number | null;

  created_at!: Date;
}
