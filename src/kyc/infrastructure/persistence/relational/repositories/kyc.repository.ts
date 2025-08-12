import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { KYCEntity } from '../entities/kyc.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';

import { KYC } from '../../../../domain/kyc';
import { KYCRepository } from '../../kyc.repository';
import { KYCMapper } from '../mappers/kyc.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterKYCDto } from '../../../../dto/query-kyc.dto';
import { SortKYCDto } from '../../../../dto/sort-kyc.dto';

@Injectable()
export class KYCRelationalRepository implements KYCRepository {
  constructor(
    @InjectRepository(KYCEntity)
    private readonly kycRepository: Repository<KYCEntity>,
  ) {}

  async create(
    data: Omit<KYC, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<KYC> {
    const persistenceModel = KYCMapper.toPersistence(data);
    const newEntity = await this.kycRepository.save(
      this.kycRepository.create(persistenceModel),
    );
    return KYCMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterKYCDto | null;
    sortOptions?: SortKYCDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<KYC[]> {
    const where: FindOptionsWhere<KYCEntity> = {};
    if (filterOptions?.is_verified !== undefined) {
      where.is_verified = filterOptions.is_verified;
    }

    if (filterOptions?.userId) {
      where.user = { id: Number(filterOptions.userId) };
    }

    if (filterOptions?.created_at) {
      where.created_at = filterOptions.created_at;
    }

    const entities = await this.kycRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.field]: sort.direction,
        }),
        {},
      ),
      relations: ['user'],
    });

    return entities.map((kyc) => KYCMapper.toDomain(kyc));
  }

  async findById(id: KYC['id']): Promise<NullableType<KYC>> {
    const entity = await this.kycRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    return entity ? KYCMapper.toDomain(entity) : null;
  }

  async findByUserId(user: KYC['user']): Promise<NullableType<KYC>> {
    if (!user || !user.id) {
      return null;
    }
    const entity = await this.kycRepository.findOne({
      where: { user: { id: Number(user.id) } },
      relations: ['user'],
    });
    return entity ? KYCMapper.toDomain(entity) : null;
  }

  async update(id: KYC['id'], payload: Partial<KYC>): Promise<KYC> {
    const entity = await this.kycRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('KYC record not found');
    }

    const updatedModel = KYCMapper.toPersistence({
      ...KYCMapper.toDomain(entity),
      ...payload,
    });
    const savedEntity = await this.kycRepository.save(
      this.kycRepository.create(updatedModel),
    );

    return KYCMapper.toDomain(savedEntity);
  }

  async remove(id: KYC['id']): Promise<void> {
    await this.kycRepository.softDelete(id);
  }
}
