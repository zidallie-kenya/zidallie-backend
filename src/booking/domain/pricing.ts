import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Pricing {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: String })
  @Expose()
  region!: string;

  @ApiProperty({ type: String, example: 'carpool' })
  @Expose()
  service_type!: string;

  @ApiProperty({ type: String, example: '0-5' })
  @Expose()
  distance_range!: string;

  @ApiProperty({ type: Number })
  @Expose()
  max_km!: number;

  @ApiProperty({ type: Number })
  @Expose()
  price!: number;

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;
}
