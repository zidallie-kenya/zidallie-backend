import { PartialType } from '@nestjs/swagger';
import { CreateKYCDto } from './create-kyc.dto';

export class UpdateKycDto extends PartialType(CreateKYCDto) {}
