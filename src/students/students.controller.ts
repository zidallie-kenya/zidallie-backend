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
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
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
import { Student } from './domain/student';
import { StudentsService } from './students.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { QueryStudentDto } from './dto/query-stuudent.dto';

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.user)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Students')
@Controller({
  path: 'students',
  version: '1',
})
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiCreatedResponse({
    type: Student,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return this.studentsService.create(createStudentDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Student),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryStudentDto,
  ): Promise<InfinityPaginationResponseDto<Student>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.studentsService.findManyWithPagination({
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
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('search')
  @HttpCode(HttpStatus.OK)
  searchByName(@Query('name') name: string): Promise<Student[]> {
    return this.studentsService.searchByName(name);
  }

  @ApiOkResponse({
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('parent/:parentId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'parentId',
    type: String,
    required: true,
  })
  findByParentId(@Param('parentId') parentId: string): Promise<Student[]> {
    return this.studentsService.findByParentId(Number(parentId));
  }

  @ApiOkResponse({
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('school/:schoolId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'schoolId',
    type: String,
    required: true,
  })
  findBySchoolId(@Param('schoolId') schoolId: string): Promise<Student[]> {
    return this.studentsService.findBySchoolId(Number(schoolId));
  }

  @ApiOkResponse({
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('gender/:gender')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'gender',
    type: String,
    required: true,
  })
  findByGender(@Param('gender') gender: string): Promise<Student[]> {
    return this.studentsService.findByGender(gender);
  }

  @ApiOkResponse({
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('active-rides')
  @HttpCode(HttpStatus.OK)
  findStudentsWithActiveRides(): Promise<Student[]> {
    return this.studentsService.findStudentsWithActiveRides();
  }

  @ApiOkResponse({
    type: [Student],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('without-parent')
  @HttpCode(HttpStatus.OK)
  findStudentsWithoutParent(): Promise<Student[]> {
    return this.studentsService.findStudentsWithoutParent();
  }

  @ApiOkResponse({
    type: Student,
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
  findOne(@Param('id') id: Student['id']): Promise<NullableType<Student>> {
    return this.studentsService.findById(id);
  }

  @ApiOkResponse({
    type: Student,
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
    @Param('id') id: Student['id'],
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Student | null> {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Student['id']): Promise<void> {
    return this.studentsService.remove(id);
  }
}
