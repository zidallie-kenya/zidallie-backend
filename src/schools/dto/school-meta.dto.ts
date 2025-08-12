import { ApiProperty } from '@nestjs/swagger';

export class SchoolMetaDto {
  @ApiProperty({ type: String, nullable: true })
  administrator_name: string | null;

  @ApiProperty({ type: String, nullable: true })
  administrator_phone: string | null;

  @ApiProperty({ type: String, nullable: true })
  administrator_email: string | null;

  @ApiProperty({ type: String, nullable: true })
  official_email: string | null;

  @ApiProperty({ type: String, nullable: true })
  logo: string | null;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  latitude: number;
}
