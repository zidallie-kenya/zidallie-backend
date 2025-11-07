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
  constructor(private readonly schoolsRepository: SchoolRepository) { }

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
      smart_card_url: createSchoolDto.smart_card_url ?? null,
      terra_email: createSchoolDto.terra_email ?? null,
      terra_password: createSchoolDto.terra_password ?? null,
      terra_tag_id: createSchoolDto.terra_tag_id ?? null,
      disbursement_phone_number: createSchoolDto.disbursement_phone_number ?? null,
      bank_paybill_number: createSchoolDto.bank_paybill_number ?? null,
      bank_account_number: createSchoolDto.bank_account_number ?? null
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
      smart_card_url: updateSchoolDto.smart_card_url,
      terra_email: updateSchoolDto.terra_email,
      terra_password: updateSchoolDto.terra_password,
      terra_tag_id: updateSchoolDto.terra_tag_id,
    });
  }

  async remove(id: School['id']): Promise<void> {
    await this.schoolsRepository.remove(id);
  }
}
