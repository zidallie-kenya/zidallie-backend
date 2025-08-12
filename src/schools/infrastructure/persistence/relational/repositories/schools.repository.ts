import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In, ILike } from 'typeorm';
import { SchoolEntity } from '../entities/school.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';

import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { School } from '../../../../domain/schools';
import { SchoolMapper } from '../mappers/schools.mapper';
import {
  FilterSchoolDto,
  SortSchoolDto,
} from '../../../../dto/query-school.dto';
import { SchoolRepository } from '../../schools.repository';

@Injectable()
export class SchoolsRelationalRepository implements SchoolRepository {
  constructor(
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
  ) {}

  async create(data: School): Promise<School> {
    const persistenceModel = SchoolMapper.toPersistence(data);
    const newEntity = await this.schoolsRepository.save(
      this.schoolsRepository.create(persistenceModel),
    );
    return SchoolMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSchoolDto | null;
    sortOptions?: SortSchoolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<School[]> {
    const where: FindOptionsWhere<SchoolEntity> = {};

    if (filterOptions?.name) {
      where.name = ILike(`%${filterOptions.name}%`);
    }

    if (filterOptions?.location) {
      where.location = ILike(`%${filterOptions.location}%`);
    }

    const entities = await this.schoolsRepository.find({
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
      relations: ['students', 'rides', 'onboardings'],
    });

    return entities.map((school) => SchoolMapper.toDomain(school));
  }

  async findById(id: School['id']): Promise<NullableType<School>> {
    const entity = await this.schoolsRepository.findOne({
      where: { id: Number(id) },
      relations: ['students', 'rides', 'onboardings'],
    });

    return entity ? SchoolMapper.toDomain(entity) : null;
  }

  async findByIds(ids: School['id'][]): Promise<School[]> {
    const entities = await this.schoolsRepository.find({
      where: { id: In(ids) },
      relations: ['students', 'rides', 'onboardings'],
    });

    return entities.map((school) => SchoolMapper.toDomain(school));
  }

  async findByName(name: string): Promise<NullableType<School>> {
    const entity = await this.schoolsRepository.findOne({
      where: { name },
      relations: ['students', 'rides', 'onboardings'],
    });

    return entity ? SchoolMapper.toDomain(entity) : null;
  }

  async searchByName(searchTerm: string): Promise<School[]> {
    const entities = await this.schoolsRepository.find({
      where: { name: ILike(`%${searchTerm}%`) },
      relations: ['students', 'rides', 'onboardings'],
      order: { name: 'ASC' },
    });

    return entities.map((school) => SchoolMapper.toDomain(school));
  }

  async findByLocation(location: string): Promise<School[]> {
    const entities = await this.schoolsRepository.find({
      where: { location: ILike(`%${location}%`) },
      relations: ['students', 'rides', 'onboardings'],
      order: { name: 'ASC' },
    });

    return entities.map((school) => SchoolMapper.toDomain(school));
  }

  async findWithStudentCount(): Promise<any[]> {
    const entities = await this.schoolsRepository
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.students', 'students')
      .loadRelationCountAndMap('school.studentCount', 'school.students')
      .orderBy('school.name', 'ASC')
      .getMany();

    return entities.map((school) => ({
      ...SchoolMapper.toDomain(school),
      studentCount: (school as any).studentCount,
    }));
  }

  async update(id: School['id'], payload: Partial<School>): Promise<School> {
    const entity = await this.schoolsRepository.findOne({
      where: { id: Number(id) },
      relations: ['students', 'rides', 'onboardings'],
    });

    if (!entity) {
      throw new Error('School not found');
    }

    const updatedEntity = await this.schoolsRepository.save(
      this.schoolsRepository.create(
        SchoolMapper.toPersistence({
          ...SchoolMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return SchoolMapper.toDomain(updatedEntity);
  }

  async remove(id: School['id']): Promise<void> {
    await this.schoolsRepository.delete(id);
  }
}
