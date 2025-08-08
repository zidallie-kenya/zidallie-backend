import { Injectable } from '@nestjs/common';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { KYCRepository } from './infrastructure/persistence/kyc.repository';

@Injectable()
export class KycService {
  constructor(private readonly kycrepository: KYCRepository) {}
  create(createKycDto: CreateKYCDto) {
    console.log(createKycDto);
    return 'This action adds a new kyc';
  }

  findAll() {
    return `This action returns all kyc`;
  }

  findOne(id: number) {
    return `This action returns a #${id} kyc`;
  }

  update(id: number, updateKycDto: UpdateKycDto) {
    console.log(updateKycDto);
    return `This action updates a #${id} kyc`;
  }

  remove(id: number) {
    return `This action removes a #${id} kyc`;
  }
}
