// types/ride-schedule.ts
export interface RideSchedule {
  cost: number | null;
  paid: number | null;
  pickup: {
    start_time: string;
    location: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    start_time: string;
    location: string;
    latitude: number;
    longitude: number;
  };
  comments?: string;
  dates?: string[];
  kind?: 'Private' | 'Carpool' | 'Bus';
}
