export interface SolverStop {
  node_id: string;
  lat: number;
  lon: number;
  school_id: string;
  demand?: number;
  time_window_start_s?: number;
  time_window_end_s?: number;
  service_time_s?: number;
  reference_time_s: number;
}

export interface SolverVehicle {
  driver_id: number;
  vehicle_id: number;
  // capacity removed — rule 6: no per-vehicle seat-capacity concept
  // anywhere in this pipeline anymore. Every vehicle in a solve is
  // capped by the solver's own shared, adjustable
  // SolveRequest.max_children_per_route instead.
  shift_start_s: number;
  shift_end_s: number;
  home_lat: number;
  home_lon: number;
}

export interface SolverSchool {
  school_id: string;
  lat: number;
  lon: number;
  window_start_s?: number;
  window_end_s?: number;
  service_time_s?: number;
}

export interface SolveRequest {
  kind: 'pickup' | 'dropoff';
  stops: SolverStop[];
  vehicles: SolverVehicle[];
  schools: SolverSchool[];
  time_limit_seconds?: number;
  max_first_stop_distance_m?: number;
  max_trip_duration_s?: number;
  max_student_spread_m?: number;
  max_school_spread_m?: number;
  max_school_count?: number;
  max_timing_diff_s?: number;
  // Rule 6 — replaces per-vehicle capacity. Shared cap applied to every
  // vehicle in the request; defaults to 4 on the solver side if omitted.
  max_children_per_route?: number;
  compare_unordered?: boolean;
}

export interface SolverRouteStop {
  stop_type: 'student' | 'school';
  node_id: string;
  sequence: number;
  arrival_time_s: number;
  distance_from_previous_m: number;
  duration_from_previous_s: number;
}

export interface SolverRoute {
  driver_id: number;
  vehicle_id: number;
  stops: SolverRouteStop[];
  total_duration_s: number;
  total_distance_m: number;
  start_time_s: number;
  end_time_s: number;
}

export interface SolveResponse {
  routes: SolverRoute[];
  unassigned_node_ids: string[];
  total_time_s: number;
  unordered_total_time_s?: number;
  ordering_cost_s?: number;
}
