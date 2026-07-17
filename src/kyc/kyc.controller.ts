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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
// import { FilterKYCDto } from './dto/query-kyc.dto';
// import { SortKYCDto } from './dto/sort-kyc.dto';
// import { IPaginationOptions } from '../utils/types/pagination-options';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiBearerAuth()
  @SerializeOptions({ groups: ['me'] })
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'national_id_front', maxCount: 1 },
      { name: 'national_id_back', maxCount: 1 },
      { name: 'passport_photo', maxCount: 1 },
      { name: 'driving_license', maxCount: 1 },
      { name: 'certificate_of_good_conduct', maxCount: 1 },
      { name: 'kra_pin_vertificate', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: KYC })
  async create(
    @Body() createKycDto: CreateKYCDto,
    @UploadedFiles()
    files: {
      national_id_front?: Express.Multer.File[];
      national_id_back?: Express.Multer.File[];
      passport_photo?: Express.Multer.File[];
      driving_license?: Express.Multer.File[];
      certificate_of_good_conduct?: Express.Multer.File[];
      kra_pin_vertificate?: Express.Multer.File[];
    },
    @Request() request,
  ): Promise<KYC> {
    console.log(
      'Files received in Controller====> KYC:',
      Object.keys(files || {}),
    );

    const token = request.headers.authorization?.replace('Bearer ', '');
    return this.kycService.create(createKycDto, files, token);
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
