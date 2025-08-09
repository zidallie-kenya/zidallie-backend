import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateKYCDto {
  @ApiProperty({
    type: String,
    example: 'path/to/national_id_front.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  national_id_front: string | null;

  @ApiProperty({
    type: String,
    example: 'path/to/national_id_back.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  national_id_back: string | null;

  @ApiProperty({
    type: String,
    example: 'path/to/passport_photo.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  passport_photo: string | null;

  @ApiProperty({
    type: String,
    example: 'path/to/driving_license.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  driving_license: string | null;

  @ApiProperty({
    type: String,
    example: 'path/to/certificate_of_good_conduct.jpg',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  certificate_of_good_conduct: string | null;

  @ApiProperty({
    type: String,
    example: 'Additional verification notes',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  comments: string;

  @ApiProperty({ type: Number, example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ type: Boolean, example: false })
  @IsBoolean()
  is_verified: boolean;
}
