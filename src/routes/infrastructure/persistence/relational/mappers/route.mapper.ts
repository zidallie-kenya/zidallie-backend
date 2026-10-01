// routes/infrastructure/persistence/relational/mappers/route.mapper.ts
import { Route } from '../../../../domain/route';
import { RouteStop } from '../../../../domain/route-stop';
import { RouteEntity } from '../entities/route.entity';
import { RouteStopEntity } from '../entities/route-stop.entity';

export class RouteMapper {
  static toDomain(entity: RouteEntity): Route {
    const domain = new Route();
    domain.id = entity.id;
    domain.term = entity.term;
    domain.service_type = entity.service_type;
    domain.kind = entity.kind;
    domain.trip_date = entity.trip_date;
    domain.driver_id = entity.driver?.id ?? null;
    domain.vehicle_id = entity.vehicle?.id ?? null;
    domain.carpool_school_id = entity.carpool_school?.id ?? null;
    domain.bus_school_id = entity.bus_school?.id ?? null;
    domain.status = entity.status;
    domain.total_distance_km = entity.total_distance_km;
    domain.total_duration_minutes = entity.total_duration_minutes;
    domain.route_start_time = entity.route_start_time;
    domain.route_end_time = entity.route_end_time;
    domain.trip_amount = entity.trip_amount;
    domain.origin_latitude = entity.origin_latitude;
    domain.origin_longitude = entity.origin_longitude;
    domain.meta = entity.meta;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    if (entity.stops) {
      domain.stops = entity.stops
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map(RouteStopMapper.toDomain);
    }
    return domain;
  }

  static toEntity(domain: Partial<Route>): Partial<RouteEntity> {
    const entity: Partial<RouteEntity> = {
      term: domain.term,
      service_type: domain.service_type,
      kind: domain.kind,
      trip_date: domain.trip_date,
      status: domain.status,
      total_distance_km: domain.total_distance_km,
      total_duration_minutes: domain.total_duration_minutes,
      route_start_time: domain.route_start_time,
      route_end_time: domain.route_end_time,
      trip_amount: domain.trip_amount,
      origin_latitude: domain.origin_latitude,
      origin_longitude: domain.origin_longitude,
      meta: domain.meta,
    };
    if (domain.driver_id !== undefined) {
      entity.driver = domain.driver_id
        ? ({ id: domain.driver_id } as any)
        : null;
    }
    if (domain.vehicle_id !== undefined) {
      entity.vehicle = domain.vehicle_id
        ? ({ id: domain.vehicle_id } as any)
        : null;
    }
    if (domain.carpool_school_id !== undefined) {
      entity.carpool_school = domain.carpool_school_id
        ? ({ id: domain.carpool_school_id } as any)
        : null;
    }
    if (domain.bus_school_id !== undefined) {
      entity.bus_school = domain.bus_school_id
        ? ({ id: domain.bus_school_id } as any)
        : null;
    }
    return entity;
  }
}

export class RouteStopMapper {
  static toDomain(entity: RouteStopEntity): RouteStop {
    const domain = new RouteStop();
    domain.id = entity.id;
    domain.route_id = entity.route?.id;
    domain.student_id = entity.student?.id ?? null;
    domain.booking_child_id = entity.booking_child?.id ?? null;
    domain.pickup_station_id = entity.pickup_station?.id ?? null;
    domain.sequence_order = entity.sequence_order;
    domain.kind = entity.kind;
    domain.latitude = Number(entity.latitude);
    domain.longitude = Number(entity.longitude);
    domain.address_label = entity.address_label;
    domain.time_window_start = entity.time_window_start;
    domain.time_window_end = entity.time_window_end;
    domain.estimated_arrival = entity.estimated_arrival;
    domain.actual_arrival = entity.actual_arrival;
    domain.status = entity.status;
    domain.distance_from_previous_m = entity.distance_from_previous_m;
    domain.duration_from_previous_s = entity.duration_from_previous_s;
    domain.created_at = entity.created_at;
    return domain;
  }

  static toEntity(domain: Partial<RouteStop>): Partial<RouteStopEntity> {
    return {
      sequence_order: domain.sequence_order,
      kind: domain.kind,
      latitude: domain.latitude,
      longitude: domain.longitude,
      address_label: domain.address_label,
      time_window_start: domain.time_window_start,
      time_window_end: domain.time_window_end,
      estimated_arrival: domain.estimated_arrival,
      actual_arrival: domain.actual_arrival,
      status: domain.status,
      distance_from_previous_m: domain.distance_from_previous_m,
      duration_from_previous_s: domain.duration_from_previous_s,
      student: domain.student_id ? ({ id: domain.student_id } as any) : null,
      booking_child: domain.booking_child_id
        ? ({ id: domain.booking_child_id } as any)
        : null,
      pickup_station: domain.pickup_station_id
        ? ({ id: domain.pickup_station_id } as any)
        : null,
    };
  }
}
