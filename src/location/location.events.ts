// location.events.ts
export class LocationUpdatedEvent {
  constructor(
    public readonly driverId: string,
    public readonly rideId: string,
    public readonly location: {
      latitude: number;
      longitude: number;
      timestamp: string;
    },
  ) {}
}
