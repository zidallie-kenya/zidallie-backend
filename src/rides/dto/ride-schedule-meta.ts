import { ApiProperty } from '@nestjs/swagger';

class PickupDropoffDto {
  @ApiProperty()
  start_time: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;
}

export class RideScheduleDto {
  @ApiProperty({ type: Number, nullable: true })
  cost: number | null;

  @ApiProperty({ type: Number, nullable: true })
  paid: number | null;

  @ApiProperty({ type: () => PickupDropoffDto })
  pickup: PickupDropoffDto;

  @ApiProperty({ type: () => PickupDropoffDto })
  dropoff: PickupDropoffDto;

  @ApiProperty({ type: String, required: false, nullable: true })
  comments?: string;

  @ApiProperty({ type: [String], required: false })
  dates?: string[];

  @ApiProperty({ enum: ['Private', 'Carpool', 'Bus'], required: false })
  kind?: 'Private' | 'Carpool' | 'Bus';
}
