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
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { School } from './domain/schools';
import { SchoolsService } from './schools.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { QuerySchoolDto } from './dto/school-query.dto';

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Schools')
@Controller({
  path: 'schools',
  version: '1',
})
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @ApiCreatedResponse({
    type: School,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSchoolDto: CreateSchoolDto): Promise<School> {
    return this.schoolsService.create(createSchoolDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(School),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QuerySchoolDto,
  ): Promise<InfinityPaginationResponseDto<School>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 30;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.schoolsService.findManyWithPagination({
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
    type: School,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('search')
  @HttpCode(HttpStatus.OK)
  searchByName(@Query('name') name: string): Promise<School[]> {
    return this.schoolsService.searchByName(name);
  }

  @ApiOkResponse({
    type: School,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('with-student-count')
  @HttpCode(HttpStatus.OK)
  findWithStudentCount(): Promise<any[]> {
    return this.schoolsService.findWithStudentCount();
  }

  @ApiOkResponse({
    type: School,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: School['id']): Promise<NullableType<School>> {
    return this.schoolsService.findById(id);
  }

  @ApiOkResponse({
    type: School,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: School['id'],
    @Body() updateSchoolDto: UpdateSchoolDto,
  ): Promise<School | null> {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: School['id']): Promise<void> {
    return this.schoolsService.remove(id);
  }
}
