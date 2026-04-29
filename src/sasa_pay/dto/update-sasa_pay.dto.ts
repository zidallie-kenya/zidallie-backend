import { PartialType } from '@nestjs/swagger';
import { CreateSasaPayDto } from './create-sasa_pay.dto';

export class UpdateSasaPayDto extends PartialType(CreateSasaPayDto) {}
