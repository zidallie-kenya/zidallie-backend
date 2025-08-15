import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { FilterSchoolDto, SortSchoolDto } from './dto/query-school.dto';
import { School } from './domain/schools';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolRepository } from './infrastructure/persistence/schools.repository';
import { CreateSchoolDto } from './dto/create-school.dto';

@Injectable()
export class SchoolsService {
  constructor(private readonly schoolsRepository: SchoolRepository) {}

  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    // Check if school with same name already exists
    if (createSchoolDto.name) {
      const existing = await this.schoolsRepository.findByName(
        createSchoolDto.name,
      );

      if (existing) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'This school already exists',
          },
        });
      }
    }

    return this.schoolsRepository.create({
      name: createSchoolDto.name,
      location: createSchoolDto.location ?? null,
      comments: createSchoolDto.comments ?? null,
      url: createSchoolDto.url ?? null,
      meta: createSchoolDto.meta ?? null,
      students: [],
      rides: [],
      onboardings: [],
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSchoolDto | null;
    sortOptions?: SortSchoolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<School[]> {
    return this.schoolsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: School['id']): Promise<NullableType<School>> {
    return this.schoolsRepository.findById(id);
  }

  findByIds(ids: School['id'][]): Promise<School[]> {
    return this.schoolsRepository.findByIds(ids);
  }

  findByName(name: string): Promise<NullableType<School>> {
    return this.schoolsRepository.findByName(name);
  }

  searchByName(searchTerm: string): Promise<School[]> {
    return this.schoolsRepository.searchByName(searchTerm);
  }

  findByLocation(location: string): Promise<School[]> {
    return this.schoolsRepository.findByLocation(location);
  }

  findWithStudentCount(): Promise<any[]> {
    return this.schoolsRepository.findWithStudentCount();
  }

  async update(
    id: School['id'],
    updateSchoolDto: UpdateSchoolDto,
  ): Promise<School | null> {
    // Check if school with same name already exists (excluding current school)
    if (updateSchoolDto.name) {
      const existing = await this.schoolsRepository.findByName(
        updateSchoolDto.name,
      );

      if (existing && existing.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'this school already exists',
          },
        });
      }
    }

    return this.schoolsRepository.update(id, {
      name: updateSchoolDto.name,
      location: updateSchoolDto.location,
      comments: updateSchoolDto.comments,
      url: updateSchoolDto.url,
      meta: updateSchoolDto.meta,
    });
  }

  async remove(id: School['id']): Promise<void> {
    await this.schoolsRepository.remove(id);
  }
}
