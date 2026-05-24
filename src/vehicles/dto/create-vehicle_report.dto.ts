import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVehicleReportDto {
  @ApiProperty({ example: 'https://s3.example.com/reports/jan-inspection.pdf' })
  @IsString()
  @IsNotEmpty()
  report_url!: string;

  @ApiProperty({ example: 'jan-inspection.pdf' })
  @IsString()
  @IsNotEmpty()
  file_name!: string;
}
