import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Cluster {
  @ApiProperty({ type: Number })
  @Expose()
  id!: number;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  name!: string | null;

  @ApiProperty({ type: String })
  @Expose()
  zone!: string;

  @ApiProperty({ type: Number })
  @Expose()
  max_capacity!: number;

  @ApiProperty({ type: Number })
  @Expose()
  seat_capacity!: number;

  @ApiProperty({ type: Boolean })
  @Expose()
  is_active!: boolean;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  term!: string | null;

  @ApiProperty({ type: Date })
  @Expose()
  created_at!: Date;

  @ApiProperty({ type: Date })
  @Expose()
  updated_at!: Date;

  constructor(partial?: Partial<Cluster>) {
    Object.assign(this, partial);
  }
}
