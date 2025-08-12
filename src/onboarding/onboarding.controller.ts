import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryOnboardingDto } from './dto/query-onboarding.dto';
import { Onboarding } from './domain/onboarding';
import { OnboardingService } from './onboarding.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@ApiTags('Onboarding')
@Controller({
  path: 'onboarding',
  version: '1',
})
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiCreatedResponse({
    type: Onboarding,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createOnboardingDto: CreateOnboardingDto,
  ): Promise<Onboarding> {
    return this.onboardingService.create(createOnboardingDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Onboarding),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryOnboardingDto,
  ): Promise<InfinityPaginationResponseDto<Onboarding>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.onboardingService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: Onboarding,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(
    @Param('id') id: Onboarding['id'],
  ): Promise<NullableType<Onboarding>> {
    return this.onboardingService.findById(id);
  }

  @ApiOkResponse({
    type: [Onboarding],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('parent/email/:email')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'email',
    type: String,
    required: true,
  })
  findByParentEmail(@Param('email') email: string): Promise<Onboarding[]> {
    return this.onboardingService.findByParentEmail(email);
  }

  @ApiOkResponse({
    type: [Onboarding],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('parent/phone/:phone')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'phone',
    type: String,
    required: true,
  })
  findByParentPhone(@Param('phone') phone: string): Promise<Onboarding[]> {
    return this.onboardingService.findByParentPhone(phone);
  }

  @ApiOkResponse({
    type: [Onboarding],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('school/:schoolId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'schoolId',
    type: Number,
    required: true,
  })
  findBySchoolId(@Param('schoolId') schoolId: number): Promise<Onboarding[]> {
    return this.onboardingService.findBySchoolId(schoolId);
  }

  @ApiOkResponse({
    type: [Onboarding],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('date-range')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: true,
    description: 'Start date in ISO format (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: true,
    description: 'End date in ISO format (YYYY-MM-DD)',
  })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Onboarding[]> {
    return this.onboardingService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @ApiOkResponse({
    type: Onboarding,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Onboarding['id'],
    @Body() updateOnboardingDto: UpdateOnboardingDto,
  ): Promise<Onboarding | null> {
    return this.onboardingService.update(id, updateOnboardingDto);
  }

  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Onboarding['id']): Promise<void> {
    return this.onboardingService.remove(id);
  }
}
