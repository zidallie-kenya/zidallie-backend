import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KYC } from './domain/kyc';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { NullableType } from '../utils/types/nullable.type';
import { UpdateKycDto } from './dto/update-kyc.dto';
// import { FilterKYCDto } from './dto/query-kyc.dto';
// import { SortKYCDto } from './dto/sort-kyc.dto';
// import { IPaginationOptions } from '../utils/types/pagination-options';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    type: KYC,
  })
  async create(
    @Body() createKycDto: CreateKYCDto,
    @Request() request,
  ): Promise<KYC> {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.create(createKycDto, token);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('list')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: [KYC],
  })
  findAll(@Request() request?: any): Promise<KYC[]> {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.findAll(token);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('driver/:driverId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: KYC,
  })
  async findByDriverId(
    @Param('driverId') driverId: string,
    @Request() request,
  ): Promise<NullableType<KYC>> {
    // Validate driver ID before parsing
    const numericDriverId = parseInt(driverId, 10);
    if (isNaN(numericDriverId)) {
      throw new BadRequestException('Invalid driver ID format');
    }

    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.findByDriverId(numericDriverId, token);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: KYC,
  })
  async findById(
    @Param('id') id: string,
    @Request() request,
  ): Promise<NullableType<KYC>> {
    // Validate ID before parsing
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID format');
    }
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.findById(numericId, token);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: KYC,
  })
  async update(
    @Param('id') id: string,
    @Body() updateKycDto: UpdateKycDto,
    @Request() request,
  ): Promise<NullableType<KYC>> {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.update(parseInt(id, 10), updateKycDto, token);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse()
  async remove(@Param('id') id: string, @Request() request): Promise<void> {
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.remove(parseInt(id, 10), token);
  }
}
