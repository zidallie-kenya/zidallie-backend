import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { Vehicle } from '../../../../domain/vehicles';
import { VehicleMapper } from '../mappers/vehicles.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { VehicleEntity } from '../entities/vehicle.entity';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterVehicleDto,
  SortVehicleDto,
} from '../../../../dto/query-vehicle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { VehicleRepository } from '../../vehicles.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VehiclesRelationalRepository implements VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
  ) {}

  async create(data: Vehicle): Promise<Vehicle> {
    const persistenceModel = VehicleMapper.toPersistence(data);
    const newEntity = await this.vehiclesRepository.save(
      this.vehiclesRepository.create(persistenceModel),
    );
    return VehicleMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterVehicleDto | null;
    sortOptions?: SortVehicleDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Vehicle[]> {
    const where: FindOptionsWhere<VehicleEntity> = {};

    if (filterOptions?.userId) {
      where.user = { id: Number(filterOptions.userId) };
    }

    if (filterOptions?.registration_number) {
      where.registration_number = ILike(
        `%${filterOptions.registration_number}%`,
      );
    }

    if (filterOptions?.vehicle_type) {
      where.vehicle_type = filterOptions.vehicle_type;
    }

    if (filterOptions?.vehicle_model) {
      where.vehicle_model = ILike(`%${filterOptions.vehicle_model}%`);
    }

    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    if (filterOptions?.is_inspected !== undefined) {
      where.is_inspected = filterOptions.is_inspected;
    }

    const entities = await this.vehiclesRepository.find({
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
      relations: ['user'],
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  // NOTE: intentionally scoped to ['user'] only. This method sits on the hot
  // path for every create/update/delete (existence checks, pre-update fetch).
  // It previously joined 'rides', 'rides.vehicle', 'rides.driver',
  // 'rides.school', 'rides.student', 'rides.parent', 'daily_rides', and
  // 'rides.daily_rides' — a double self-join back through rides.vehicle plus
  // several nested one-to-many fan-outs, which produced 30s+ queries once a
  // vehicle accumulated meaningful ride history. If a detail view genuinely
  // needs ride history, add a separate method rather than re-loading this one.
  async findById(
    id: Vehicle['id'],
    entityManager?: EntityManager,
  ): Promise<NullableType<Vehicle>> {
    const repo = entityManager
      ? entityManager.getRepository(VehicleEntity)
      : this.vehiclesRepository;

    const entity = await repo.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  // NOTE: verify callers before assuming this is safe long-term — if some
  // caller genuinely needs ride/daily_ride history for a batch of vehicles,
  // reintroduce those relations here specifically rather than in the
  // single-vehicle methods above.
  async findByIds(ids: Vehicle['id'][]): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  // NOTE: also used internally by VehicleService.create()/update() purely as
  // a duplicate-registration-number check, which never reads .rides or
  // .daily_rides. If the public GET .../registration/:registrationNumber
  // endpoint is meant to be a full detail view including ride history,
  // consider splitting this into two methods instead of re-adding relations
  // here (which would slow the internal duplicate-check callers too).
  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<NullableType<Vehicle>> {
    const entity = await this.vehiclesRepository.findOne({
      where: { registration_number: registrationNumber },
      relations: ['user'],
    });

    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { user: { id: userId } },
      relations: ['user'], // dropped 'rides' and 'daily_rides' — this endpoint doesn't need ride history
      order: { created_at: 'DESC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findAvailableVehicles(): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: {
        status: 'Active' as any,
        is_inspected: true,
      },
      relations: ['user'],
      order: { vehicle_name: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findByVehicleType(vehicleType: string): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { vehicle_type: vehicleType as any },
      relations: ['user'],
      order: { vehicle_name: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findInspectedVehicles(): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { is_inspected: true },
      relations: ['user'],
      order: { vehicle_name: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findVehiclesWithAvailableSeats(minSeats: number): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: {
        status: 'Active' as any,
        is_inspected: true,
      },
      relations: ['user'],
    });

    // Filter vehicles with available seats >= minSeats
    const filteredEntities = entities.filter(
      (vehicle) => vehicle.available_seats >= minSeats,
    );

    return filteredEntities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async searchByModel(searchTerm: string): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { vehicle_model: ILike(`%${searchTerm}%`) },
      relations: ['user'],
      order: { vehicle_model: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async existsById(id: number): Promise<boolean> {
    const count = await this.vehiclesRepository.count({
      where: { id: Number(id) },
    });
    return count > 0;
  }

  async updateAvailableSeats(
    id: Vehicle['id'],
    availableSeats: number,
  ): Promise<Vehicle> {
    const entity = await this.vehiclesRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('Vehicle not found');
    }

    entity.available_seats = availableSeats;
    const updatedEntity = await this.vehiclesRepository.save(entity);

    return VehicleMapper.toDomain(updatedEntity);
  }

  // NOTE: previously joined 'rides' and 'daily_rides' here, which had a second
  // effect beyond slowness — VehicleMapper.toDomain(entity) would map the full
  // rides/daily_rides arrays, and since payload.rides/payload.daily_rides are
  // undefined unless the caller explicitly sets them, the spread below kept
  // the loaded arrays and VehicleMapper.toPersistence would re-serialize and
  // re-save every ride and daily_ride row on every plain vehicle-field update.
  // With relations scoped to ['user'], rides/daily_rides come back as [] from
  // the mapper, so toPersistence's `!== undefined` guards skip them entirely
  // unless a caller explicitly passes rides/daily_rides in payload.
  async update(id: Vehicle['id'], payload: Partial<Vehicle>): Promise<Vehicle> {
    const entity = await this.vehiclesRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('Vehicle not found');
    }

    const updatedEntity = await this.vehiclesRepository.save(
      this.vehiclesRepository.create(
        VehicleMapper.toPersistence({
          ...VehicleMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return VehicleMapper.toDomain(updatedEntity);
  }

  async remove(id: Vehicle['id']): Promise<void> {
    await this.vehiclesRepository.softDelete(id);
  }
}
