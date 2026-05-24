import { ApiProperty } from '@nestjs/swagger';

export class VehicleReport {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty({
    type: String,
    example: 'https://example.com/docs/report123.pdf',
  })
  report_url!: string;

  @ApiProperty({
    type: String,
    example: 'inspection_report_jan_2024.pdf',
  })
  file_name!: string;

  @ApiProperty({ type: Number })
  vehicleId!: number;

  @ApiProperty()
  created_at!: Date;
}
