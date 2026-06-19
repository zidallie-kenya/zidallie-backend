import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PickupStation {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: String })
  @Expose()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  region!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  latitude!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  @Expose()
  longitude!: number | null;

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;
}
