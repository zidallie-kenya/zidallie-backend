import {
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
import { FilterKYCDto } from './dto/query-kyc.dto';
import { SortKYCDto } from './dto/sort-kyc.dto';
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
    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.findById(parseInt(id, 10), token);
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

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('list')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: [KYC],
  })
  async findManyWithPagination(
    @Request() request?: any,
    @Body()
    body?: {
      filterOptions?: FilterKYCDto;
      sortOptions?: SortKYCDto[];
      page?: number;
      limit?: number;
    },
  ): Promise<KYC[]> {
    const token = request.headers.authorization?.replace('Bearer ', '');

    return this.kycService.findManyWithPagination({
      filterOptions: body?.filterOptions ?? {},
      sortOptions: body?.sortOptions ?? [],
      paginationOptions: {
        page: Number(body?.page) || 1,
        limit: Number(body?.limit) || 10,
      },
      bearerToken: token,
    });
  }
}
