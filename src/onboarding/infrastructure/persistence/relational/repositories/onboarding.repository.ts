import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';

import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Onboarding } from '../../../../domain/onboarding';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { OnboardingFormEntity } from '../entities/onboarding.entity';
import {
  FilterOnboardingDto,
  SortOnboardingDto,
} from '../../../../dto/query-onboarding.dto';
import { OnboardingRepository } from '../../onboarding.repository';

@Injectable()
export class OnboardingRelationalRepository implements OnboardingRepository {
  constructor(
    @InjectRepository(OnboardingFormEntity)
    private readonly onboardingFormsRepository: Repository<OnboardingFormEntity>,
  ) {}

  async create(data: Onboarding): Promise<Onboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(data);
    const newEntity = await this.onboardingFormsRepository.save(
      this.onboardingFormsRepository.create(persistenceModel),
    );
    return OnboardingMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOnboardingDto | null;
    sortOptions?: SortOnboardingDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Onboarding[]> {
    const where: FindOptionsWhere<OnboardingFormEntity> = {};

    if (filterOptions?.schoolId) {
      where.school = { id: Number(filterOptions.schoolId) };
    }

    if (filterOptions?.parent_email) {
      where.parent_email = filterOptions.parent_email;
    }

    if (filterOptions?.parent_phone) {
      where.parent_phone = filterOptions.parent_phone;
    }

    if (filterOptions?.student_gender) {
      where.student_gender = filterOptions.student_gender;
    }

    if (filterOptions?.ride_type) {
      where.ride_type = filterOptions.ride_type;
    }

    const entities = await this.onboardingFormsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
      relations: ['school'],
    });

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async findById(id: Onboarding['id']): Promise<NullableType<Onboarding>> {
    const entity = await this.onboardingFormsRepository.findOne({
      where: { id: Number(id) },
      relations: ['school'],
    });

    return entity ? OnboardingMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Onboarding['id'][]): Promise<Onboarding[]> {
    const entities = await this.onboardingFormsRepository.find({
      where: { id: In(ids) },
      relations: ['school'],
    });

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async findByParentEmail(email: string): Promise<Onboarding[]> {
    const entities = await this.onboardingFormsRepository.find({
      where: { parent_email: email },
      relations: ['school'],
    });

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async findByParentPhone(phone: string): Promise<Onboarding[]> {
    const entities = await this.onboardingFormsRepository.find({
      where: { parent_phone: phone },
      relations: ['school'],
    });

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async findBySchoolId(schoolId: number): Promise<Onboarding[]> {
    const entities = await this.onboardingFormsRepository.find({
      where: { school: { id: schoolId } },
      relations: ['school'],
      order: { created_at: 'DESC' },
    });

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Onboarding[]> {
    const entities = await this.onboardingFormsRepository
      .createQueryBuilder('onboarding')
      .where('onboarding.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('onboarding.school', 'school')
      .orderBy('onboarding.created_at', 'DESC')
      .getMany();

    return entities.map((onboardingForm) =>
      OnboardingMapper.toDomain(onboardingForm),
    );
  }

  async update(
    id: Onboarding['id'],
    payload: Partial<Onboarding>,
  ): Promise<Onboarding> {
    const entity = await this.onboardingFormsRepository.findOne({
      where: { id: Number(id) },
      relations: ['school'],
    });

    if (!entity) {
      throw new Error('OnboardingForm not found');
    }

    const updatedEntity = await this.onboardingFormsRepository.save(
      this.onboardingFormsRepository.create(
        OnboardingMapper.toPersistence({
          ...OnboardingMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return OnboardingMapper.toDomain(updatedEntity);
  }

  async remove(id: Onboarding['id']): Promise<void> {
    await this.onboardingFormsRepository.delete(id);
  }
}
