import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BusSchool {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: String })
  @Expose()
  name!: string;

  @ApiProperty({ type: String })
  @Expose()
  region!: string;

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;
}
