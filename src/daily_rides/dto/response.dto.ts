import { ApiProperty } from '@nestjs/swagger';

export class VehicleInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  registration_number: string;

  @ApiProperty()
  available_seats: number;
}

export class StudentInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;
}

export class ParentInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;
}

// Create DTOs that match your actual PickupDropoffDto structure
export class LocationPointDto {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;

  @ApiProperty()
  time?: string; // If you have time in your pickup/dropoff
}

export class ScheduleInfoDto {
  @ApiProperty({ type: LocationPointDto })
  pickup: LocationPointDto;

  @ApiProperty({ type: LocationPointDto })
  dropoff: LocationPointDto;

  @ApiProperty()
  kind: string;
}

export class RideInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: VehicleInfoDto })
  vehicle: VehicleInfoDto;

  @ApiProperty({ type: StudentInfoDto })
  student: StudentInfoDto;

  @ApiProperty({ type: ParentInfoDto })
  parent: ParentInfoDto;

  @ApiProperty({ type: ScheduleInfoDto })
  schedule: ScheduleInfoDto;
}

export class MyRidesResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: RideInfoDto })
  ride: RideInfoDto;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  date?: Date;

  @ApiProperty()
  start_time?: Date;

  @ApiProperty()
  end_time?: Date;
}
