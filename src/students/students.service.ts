import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { NullableType } from '../utils/types/nullable.type';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { Student } from './domain/student';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateStudentDto } from './dto/update-student.dto';
import { School } from '../schools/domain/schools';
import { User } from '../users/domain/user';
import { FilterStudentDto, SortStudentDto } from './dto/query-stuudent.dto';
import { SchoolEntity } from '../schools/infrastructure/persistence/relational/entities/school.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentRepository,
    private readonly usersService: UserRepository,
    private readonly schoolsService: SchoolsService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    console.log('school:', createStudentDto?.school?.id);
    console.log('parent:', createStudentDto?.parent?.id);

    // Validate school reference
    let school: SchoolEntity | null = null;
    if (createStudentDto.school?.id) {
      const schoolEntity = await this.schoolsService.findById(
        createStudentDto.school.id,
      );
      if (!schoolEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { school: 'this school does not exists' },
        });
      }
      school = { id: createStudentDto.school.id } as SchoolEntity;
    } else if (createStudentDto.school && !createStudentDto.school.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { school: 'the school is is missing' },
      });
    }

    // Validate parent reference
    let parent: UserEntity | null = null;
    if (createStudentDto.parent?.id) {
      const parentEntity = await this.usersService.findById(
        createStudentDto.parent.id,
      );
      if (!parentEntity || parentEntity.kind !== 'Parent') {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            parent: parentEntity
              ? 'This is not a parent'
              : 'this parent does not exists',
          },
        });
      }
      parent = { id: createStudentDto.parent.id } as UserEntity;
    } else if (createStudentDto.parent && !createStudentDto.parent.id) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { parent: 'the parentId is missing' },
      });
    }

    try {
      return await this.studentsRepository.create({
        name: createStudentDto.name,
        school,
        parent,
        profile_picture: createStudentDto.profile_picture ?? null,
        gender: createStudentDto.gender,
        address: createStudentDto.address ?? null,
        comments: createStudentDto.comments ?? null,
        meta: createStudentDto.meta ?? null,
        // 🆕 Payment fields
        account_number: createStudentDto.account_number ?? null,
        daily_fee: createStudentDto.daily_fee ?? null,
        transport_term_fee: createStudentDto.transport_term_fee ?? null,
        service_type: createStudentDto.service_type ?? null,
        rides: [],
      });
    } catch (error) {
      console.error('Error creating student:', error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { student: 'student creation failed' },
        message: error.message,
      });
    }
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Student[]> {
    const defaultSort: SortStudentDto[] = sortOptions ?? [
      { orderBy: 'name', order: 'ASC' },
    ];
    return this.studentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions: defaultSort,
      paginationOptions,
    });
  }

  findById(id: Student['id']): Promise<NullableType<Student>> {
    return this.studentsRepository.findById(id);
  }

  findByIds(ids: Student['id'][]): Promise<Student[]> {
    return this.studentsRepository.findByIds(ids);
  }

  findByParentId(parentId: number): Promise<Student[]> {
    return this.studentsRepository.findByParentId(parentId);
  }

  findBySchoolId(schoolId: number): Promise<Student[]> {
    return this.studentsRepository.findBySchoolId(schoolId);
  }

  searchByName(searchTerm: string): Promise<Student[]> {
    return this.studentsRepository.searchByName(searchTerm);
  }

  findByGender(gender: string): Promise<Student[]> {
    return this.studentsRepository.findByGender(gender);
  }

  findStudentsWithActiveRides(): Promise<Student[]> {
    return this.studentsRepository.findStudentsWithActiveRides();
  }

  findStudentsWithoutParent(): Promise<Student[]> {
    return this.studentsRepository.findStudentsWithoutParent();
  }

  async update(
    id: Student['id'],
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student | null> {
    const updateData: Partial<Student> = {};

    if (updateStudentDto.name !== undefined) {
      updateData.name = updateStudentDto.name;
    }

    if (updateStudentDto.school !== undefined) {
      if (updateStudentDto.school?.id) {
        updateData.school = {
          id: updateStudentDto.school.id,
        } as School;
      } else if (updateStudentDto.school === null) {
        updateData.school = null;
      }
    }

    if (updateStudentDto.parent !== undefined) {
      if (updateStudentDto.parent?.id) {
        updateData.parent = {
          id: updateStudentDto.parent.id,
        } as User;
      } else if (updateStudentDto.parent === null) {
        updateData.parent = null;
      }
    }

    if (updateStudentDto.profile_picture !== undefined) {
      updateData.profile_picture = updateStudentDto.profile_picture;
    }

    if (updateStudentDto.gender !== undefined) {
      updateData.gender = updateStudentDto.gender;
    }

    if (updateStudentDto.address !== undefined) {
      updateData.address = updateStudentDto.address;
    }

    if (updateStudentDto.comments !== undefined) {
      updateData.comments = updateStudentDto.comments;
    }

    if (updateStudentDto.meta !== undefined) {
      updateData.meta = updateStudentDto.meta;
    }

    // 🆕 Payment fields
    if (updateStudentDto.account_number !== undefined) {
      updateData.account_number = updateStudentDto.account_number;
    }

    if (updateStudentDto.daily_fee !== undefined) {
      updateData.daily_fee = updateStudentDto.daily_fee;
    }

    if (updateStudentDto.transport_term_fee !== undefined) {
      updateData.transport_term_fee = updateStudentDto.transport_term_fee;
    }

    if (updateStudentDto.service_type !== undefined) {
      updateData.service_type = updateStudentDto.service_type;
    }

    return this.studentsRepository.update(id, updateData);
  }

  async remove(id: Student['id']): Promise<void> {
    await this.studentsRepository.remove(id);
  }
}
