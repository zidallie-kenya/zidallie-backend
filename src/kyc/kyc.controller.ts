import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  create(@Body() createKycDto: CreateKYCDto) {
    return this.kycService.create(createKycDto);
  }

  @Get()
  findAll() {
    return this.kycService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kycService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKycDto: UpdateKycDto) {
    return this.kycService.update(+id, updateKycDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kycService.remove(+id);
  }
}
