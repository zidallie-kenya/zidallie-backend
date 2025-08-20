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
  Req,
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
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
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
  @Get('driver')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: KYC,
  })
  async findByDriverId(@Req() req: any): Promise<NullableType<KYC>> {
    const userJwtPayload: JwtPayloadType = req.user;

    return this.kycService.findByDriverId(userJwtPayload);
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
  @Patch('update')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: KYC,
  })
  async update(
    @Req() req: any,
    @Body() updateKycDto: UpdateKycDto,
  ): Promise<NullableType<KYC>> {
    const userJwtPayload: JwtPayloadType = req.user;

    return this.kycService.update(userJwtPayload, updateKycDto);
  }

  @ApiBearerAuth()
  @Delete('delete')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse()
  async remove(@Req() req: any): Promise<void> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.kycService.remove(userJwtPayload);
  }
}
