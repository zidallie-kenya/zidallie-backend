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
      smart_card_url: createSchoolDto.smart_card_url ?? null,
      terra_email: createSchoolDto.terra_email ?? null,
      terra_password: createSchoolDto.terra_password ?? null,
      terra_tag_id: createSchoolDto.terra_tag_id ?? null,
      terra_zone_tag: createSchoolDto.terra_zone_tag ?? null,
      terra_parents_tag: createSchoolDto.terra_parents_tag ?? null,
      terra_student_tag: createSchoolDto.terra_student_tag ?? null,
      terra_school_tag: createSchoolDto.terra_school_tag ?? null,
      disbursement_phone_number:
        createSchoolDto.disbursement_phone_number ?? null,
      bank_paybill_number: createSchoolDto.bank_paybill_number ?? null,
      bank_account_number: createSchoolDto.bank_account_number ?? null,
      has_commission: createSchoolDto.has_commission ?? false,
      commission_amount: createSchoolDto.commission_amount ?? null,
      paybill: createSchoolDto.paybill ?? null,
      service_type: createSchoolDto.service_type ?? null,
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

    const updateData: Partial<School> = {};

    if (updateSchoolDto.name !== undefined) {
      updateData.name = updateSchoolDto.name;
    }
    if (updateSchoolDto.location !== undefined) {
      updateData.location = updateSchoolDto.location;
    }
    if (updateSchoolDto.comments !== undefined) {
      updateData.comments = updateSchoolDto.comments;
    }
    if (updateSchoolDto.url !== undefined) {
      updateData.url = updateSchoolDto.url;
    }
    if (updateSchoolDto.meta !== undefined) {
      updateData.meta = updateSchoolDto.meta;
    }
    if (updateSchoolDto.smart_card_url !== undefined) {
      updateData.smart_card_url = updateSchoolDto.smart_card_url;
    }
    if (updateSchoolDto.terra_email !== undefined) {
      updateData.terra_email = updateSchoolDto.terra_email;
    }
    if (updateSchoolDto.terra_password !== undefined) {
      updateData.terra_password = updateSchoolDto.terra_password;
    }
    if (updateSchoolDto.terra_tag_id !== undefined) {
      updateData.terra_tag_id = updateSchoolDto.terra_tag_id;
    }
    if (updateSchoolDto.terra_zone_tag !== undefined) {
      updateData.terra_zone_tag = updateSchoolDto.terra_zone_tag;
    }
    if (updateSchoolDto.terra_parents_tag !== undefined) {
      updateData.terra_parents_tag = updateSchoolDto.terra_parents_tag;
    }
    if (updateSchoolDto.terra_student_tag !== undefined) {
      updateData.terra_student_tag = updateSchoolDto.terra_student_tag;
    }
    if (updateSchoolDto.terra_school_tag !== undefined) {
      updateData.terra_school_tag = updateSchoolDto.terra_school_tag;
    }
    if (updateSchoolDto.disbursement_phone_number !== undefined) {
      updateData.disbursement_phone_number =
        updateSchoolDto.disbursement_phone_number;
    }
    if (updateSchoolDto.bank_paybill_number !== undefined) {
      updateData.bank_paybill_number = updateSchoolDto.bank_paybill_number;
    }
    if (updateSchoolDto.bank_account_number !== undefined) {
      updateData.bank_account_number = updateSchoolDto.bank_account_number;
    }
    if (updateSchoolDto.has_commission !== undefined) {
      updateData.has_commission = updateSchoolDto.has_commission;
    }
    if (updateSchoolDto.commission_amount !== undefined) {
      updateData.commission_amount = updateSchoolDto.commission_amount;
    }
    if (updateSchoolDto.paybill !== undefined) {
      updateData.paybill = updateSchoolDto.paybill;
    }
    if (updateSchoolDto.service_type !== undefined) {
      updateData.service_type = updateSchoolDto.service_type;
    }

    return this.schoolsRepository.update(id, updateData);
  }

  async remove(id: School['id']): Promise<void> {
    await this.schoolsRepository.remove(id);
  }
}
