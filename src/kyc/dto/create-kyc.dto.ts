import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateKYCDto {
  @ApiProperty({ type: String, example: 'path/to/national_id_front.jpg' })
  @IsString()
  @IsNotEmpty()
  national_id_front: string;

  @ApiProperty({ type: String, example: 'path/to/national_id_back.jpg' })
  @IsString()
  @IsNotEmpty()
  national_id_back: string;

  @ApiProperty({ type: String, example: 'path/to/passport_photo.jpg' })
  @IsString()
  @IsNotEmpty()
  passport_photo: string;

  @ApiProperty({ type: String, example: 'path/to/driving_license.jpg' })
  @IsString()
  @IsNotEmpty()
  driving_license: string;

  @ApiProperty({
    type: String,
    example: 'path/to/certificate_of_good_conduct.jpg',
  })
  @IsString()
  @IsNotEmpty()
  certificate_of_good_conduct: string;

  @ApiProperty({ type: String, example: 'Additional verification notes' })
  @IsString()
  @IsNotEmpty()
  comments: string;

  @ApiProperty({ type: Number, example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
