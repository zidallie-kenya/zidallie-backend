// routes/domain/route.ts
import { BookingTerm } from '../../booking/infrastructure/persistence/relational/entities/booking.entity';
import { RouteStop } from './route-stop';
// Adjust this path to wherever BookingTerm actually lives in your repo —
// it's been 'transport-bookings/...' in some of these files and
// 'booking/...' in others; pick the one that matches your real folder name
// and use it everywhere BookingTerm is imported (route.entity.ts,
// route-solve.processor.ts, and here) so it's the same type in all three,
// not three structurally-identical-but-distinct types.

export type RouteStatus =
  | 'draft'
  | 'flagged'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled';
export type RouteKind = 'pickup' | 'dropoff';
export type RouteServiceType = 'carpool' | 'bus';

export class Route {
  id?: number;
  term?: BookingTerm;
  service_type?: RouteServiceType;
  kind?: RouteKind;
  trip_date?: Date;
  driver_id?: number | null;
  vehicle_id?: number | null;
  carpool_school_id?: number | null;
  bus_school_id?: number | null;
  status?: RouteStatus;
  total_distance_km?: number | null;
  total_duration_minutes?: number | null;
  route_start_time?: string | null;
  route_end_time?: string | null;
  trip_amount?: number | null;
  origin_latitude?: number | null;
  origin_longitude?: number | null;
  meta?: {
    polyline?: string;
    solver_run_id?: string;
    flagged_reason?: string;
    replaced_route_id?: number;
  } | null;
  stops?: RouteStop[];
  created_at?: Date;
  updated_at?: Date;
}
