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
      relations: ['user', 'rides', 'daily_rides'],
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  // async findById(
  //   id: Vehicle['id'],
  //   includeRelations = true,
  // ): Promise<NullableType<Vehicle>> {
  //   const relations = includeRelations
  //     ? ['user', 'rides', 'daily_rides']
  //     : ['user'];

  //   const entity = await this.vehiclesRepository.findOne({
  //     where: { id: Number(id) },
  //     relations,
  //   });

  //   return entity ? VehicleMapper.toDomain(entity) : null;
  // }
  async findById(
    id: Vehicle['id'],
    entityManager?: EntityManager,
  ): Promise<NullableType<Vehicle>> {
    const repo = entityManager
      ? entityManager.getRepository(VehicleEntity)
      : this.vehiclesRepository;

    const entity = await repo.findOne({
      where: { id: Number(id) },
      relations: [
        'user',
        'rides',
        'rides.vehicle',
        'rides.driver',
        'rides.school',
        'rides.student',
        'rides.parent',
        'daily_rides',
        'rides.daily_rides',
      ],
    });

    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Vehicle['id'][]): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'rides', 'daily_rides'],
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<NullableType<Vehicle>> {
    const entity = await this.vehiclesRepository.findOne({
      where: { registration_number: registrationNumber },
      relations: ['user', 'rides', 'daily_rides'],
    });

    return entity ? VehicleMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'rides', 'daily_rides'],
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
      relations: ['user', 'rides', 'daily_rides'],
      order: { vehicle_name: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findByVehicleType(vehicleType: string): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { vehicle_type: vehicleType as any },
      relations: ['user', 'rides', 'daily_rides'],
      order: { vehicle_name: 'ASC' },
    });

    return entities.map((vehicle) => VehicleMapper.toDomain(vehicle));
  }

  async findInspectedVehicles(): Promise<Vehicle[]> {
    const entities = await this.vehiclesRepository.find({
      where: { is_inspected: true },
      relations: ['user', 'rides', 'daily_rides'],
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
      relations: ['user', 'rides', 'daily_rides'],
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
      relations: ['user', 'rides', 'daily_rides'],
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
      relations: ['user', 'rides', 'daily_rides'],
    });

    if (!entity) {
      throw new Error('Vehicle not found');
    }

    entity.available_seats = availableSeats;
    const updatedEntity = await this.vehiclesRepository.save(entity);

    return VehicleMapper.toDomain(updatedEntity);
  }

  async update(id: Vehicle['id'], payload: Partial<Vehicle>): Promise<Vehicle> {
    const entity = await this.vehiclesRepository.findOne({
      where: { id: Number(id) },
      relations: ['user', 'rides', 'daily_rides'],
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
