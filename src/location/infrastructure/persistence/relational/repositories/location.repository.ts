import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LocationEntity } from '../entities/location.entity';
import { Location } from '../../../../domain/location';
import { LocationMapper } from '../mappers/location.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterLocationDto,
  SortLocationDto,
} from '../../../../dto/query-location.dto';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { LocationRepository } from '../../location.repository';

@Injectable()
export class LocationsRelationalRepository implements LocationRepository {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationsRepository: Repository<LocationEntity>,
  ) {}

  async create(data: Location): Promise<Location> {
    const persistenceModel = LocationMapper.toPersistence(data);
    const newEntity = await this.locationsRepository.save(
      this.locationsRepository.create(persistenceModel),
    );
    return LocationMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterLocationDto | null;
    sortOptions?: SortLocationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Location[]> {
    let queryBuilder = this.locationsRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.daily_ride', 'daily_ride')
      .leftJoinAndSelect('location.driver', 'driver');

    // Filters
    if (filterOptions?.dailyRideId) {
      queryBuilder = queryBuilder.andWhere('daily_ride.id = :dailyRideId', {
        dailyRideId: filterOptions.dailyRideId,
      });
    }

    if (filterOptions?.driverId) {
      queryBuilder = queryBuilder.andWhere('driver.id = :driverId', {
        driverId: filterOptions.driverId,
      });
    }

    if (filterOptions?.timestamp) {
      queryBuilder = queryBuilder.andWhere('location.timestamp = :timestamp', {
        timestamp: filterOptions.timestamp,
      });
    }

    // Sorting
    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        queryBuilder = queryBuilder.addOrderBy(
          `location.${sort.orderBy}`,
          sort.order,
        );
      });
    } else {
      queryBuilder = queryBuilder.orderBy('location.timestamp', 'DESC');
    }

    // Pagination
    queryBuilder = queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const entities = await queryBuilder.getMany();
    return entities.map(LocationMapper.toDomain);
  }

  async findById(id: number): Promise<NullableType<Location>> {
    const entity = await this.locationsRepository.findOne({
      where: { id },
      relations: ['daily_ride', 'driver'],
    });

    return entity ? LocationMapper.toDomain(entity) : null;
  }

  async findByIds(ids: number[]): Promise<Location[]> {
    const entities = await this.locationsRepository.find({
      where: { id: In(ids) },
      relations: ['daily_ride', 'driver'],
    });

    return entities.map(LocationMapper.toDomain);
  }

  async findByDailyRideId(dailyRideId: number): Promise<Location[]> {
    const entities = await this.locationsRepository.find({
      where: { daily_ride: { id: dailyRideId } },
      relations: ['daily_ride', 'driver'],
      order: { timestamp: 'ASC' },
    });

    return entities.map(LocationMapper.toDomain);
  }

  async findByDriverId(driverId: number): Promise<Location[]> {
    const entities = await this.locationsRepository.find({
      where: { driver: { id: driverId } },
      relations: ['daily_ride', 'driver'],
      order: { timestamp: 'DESC' },
    });

    return entities.map(LocationMapper.toDomain);
  }

  async findByTimeRange(startTime: Date, endTime: Date): Promise<Location[]> {
    const entities = await this.locationsRepository
      .createQueryBuilder('location')
      .where('location.timestamp BETWEEN :start AND :end', {
        start: startTime,
        end: endTime,
      })
      .leftJoinAndSelect('location.daily_ride', 'daily_ride')
      .leftJoinAndSelect('location.driver', 'driver')
      .orderBy('location.timestamp', 'ASC')
      .getMany();

    return entities.map(LocationMapper.toDomain);
  }

  async findLatestByDriverId(
    driverId: number,
  ): Promise<NullableType<Location>> {
    const entity = await this.locationsRepository.findOne({
      where: { driver: { id: driverId } },
      relations: ['daily_ride', 'driver'],
      order: { timestamp: 'DESC' },
    });

    return entity ? LocationMapper.toDomain(entity) : null;
  }

  async update(id: number, payload: Partial<Location>): Promise<Location> {
    const entity = await this.locationsRepository.findOne({
      where: { id },
      relations: ['daily_ride', 'driver'],
    });

    if (!entity) {
      throw new Error('Location not found');
    }

    const updatedEntity = await this.locationsRepository.save(
      this.locationsRepository.create(
        LocationMapper.toPersistence({
          ...LocationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return LocationMapper.toDomain(updatedEntity);
  }

  async remove(id: number): Promise<void> {
    await this.locationsRepository.delete(id);
  }
}
