import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { RideEntity } from '../entities/ride.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { RideMapper } from '../mappers/ride.mapper';
import { Ride } from '../../../../domain/rides';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterRideDto, SortRideDto } from '../../../../dto/query-ride.dto';
import { RideRepository } from '../../ride.repository';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';

@Injectable()
export class RidesRelationalRepository implements RideRepository {
  constructor(
    @InjectRepository(RideEntity)
    private readonly ridesRepository: Repository<RideEntity>,
  ) {}

  async create(data: Ride): Promise<{ ride: Ride; ride_id: number }> {
    // Create entity with relationship IDs only to avoid circular mapping issues
    const entityToSave = new RideEntity();

    // Set simple properties
    entityToSave.schedule = data.schedule;
    entityToSave.comments = data.comments;
    entityToSave.admin_comments = data.admin_comments;
    entityToSave.meta = data.meta;
    entityToSave.status = data.status;
    entityToSave.daily_rides = [];

    // Set foreign key relationships using IDs only
    if (data.vehicle?.id) {
      entityToSave.vehicle = { id: data.vehicle.id } as VehicleEntity;
    } else {
      entityToSave.vehicle = null;
    }

    if (data.driver?.id) {
      entityToSave.driver = { id: data.driver.id } as UserEntity;
    } else {
      entityToSave.driver = null;
    }

    if (data.school?.id) {
      entityToSave.school = { id: data.school.id } as SchoolEntity;
    } else {
      entityToSave.school = null;
    }

    if (data.student?.id) {
      entityToSave.student = { id: data.student.id } as StudentEntity;
    } else {
      entityToSave.student = null;
    }

    if (data.parent?.id) {
      entityToSave.parent = { id: data.parent.id } as UserEntity;
    } else {
      entityToSave.parent = null;
    }

    // Save the entity first
    const savedEntity = await this.ridesRepository.save(
      this.ridesRepository.create(entityToSave),
    );

    // Then fetch the complete entity with all relations to return
    const completeEntity = await this.ridesRepository.findOne({
      where: { id: savedEntity.id },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
    });

    if (!completeEntity) {
      throw new Error('Failed to create ride');
    }

    // Return both the mapped domain object and the ride_id
    return {
      ride: RideMapper.toDomain(completeEntity),
      ride_id: savedEntity.id,
    };
  }
  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterRideDto | null;
    sortOptions?: SortRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Ride[]> {
    const where: FindOptionsWhere<RideEntity> = {};

    if (filterOptions?.vehicleId) {
      where.vehicle = { id: Number(filterOptions.vehicleId) };
    }

    if (filterOptions?.driverId) {
      where.driver = { id: Number(filterOptions.driverId) };
    }

    if (filterOptions?.schoolId) {
      where.school = { id: Number(filterOptions.schoolId) };
    }

    if (filterOptions?.studentId) {
      where.student = { id: Number(filterOptions.studentId) };
    }

    if (filterOptions?.parentId) {
      where.parent = { id: Number(filterOptions.parentId) };
    }

    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    const entities = await this.ridesRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ) || { created_at: 'DESC' },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
    });

    return entities.map((ride) => RideMapper.toDomain(ride));
  }

  async findById(id: Ride['id']): Promise<NullableType<Ride>> {
    const entity = await this.ridesRepository.findOne({
      where: { id: Number(id) },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
    });

    return entity ? RideMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Ride['id'][]): Promise<Ride[]> {
    const entities = await this.ridesRepository.find({
      where: { id: In(ids) },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
    });
    return entities.map((ride) => RideMapper.toDomain(ride));
  }

  async findByStudentId(studentId: number): Promise<Ride[]> {
    const entities = await this.ridesRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((ride) => RideMapper.toDomain(ride));
  }

  async findByParentId(parentId: number): Promise<Ride[]> {
    const entities = await this.ridesRepository.find({
      where: { parent: { id: parentId } },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((ride) => RideMapper.toDomain(ride));
  }

  async findByDriverId(driverId: number): Promise<Ride[]> {
    const entities = await this.ridesRepository.find({
      where: { driver: { id: driverId } },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
      order: { created_at: 'DESC' },
    });

    return entities.map((ride) => RideMapper.toDomain(ride));
  }

  async update(id: Ride['id'], payload: Partial<Ride>): Promise<Ride> {
    const entity = await this.ridesRepository.findOne({
      where: { id: Number(id) },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
    });

    if (!entity) {
      throw new Error('Ride not found');
    }

    const updatedEntity = await this.ridesRepository.save(
      this.ridesRepository.create(
        RideMapper.toPersistence({
          ...RideMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return RideMapper.toDomain(updatedEntity);
  }

  async remove(id: Ride['id']): Promise<void> {
    await this.ridesRepository.softDelete(id);
  }

  async findRecentByDriverId(driverId: number, limit = 10): Promise<Ride[]> {
    const entities = await this.ridesRepository.find({
      where: { driver: { id: driverId } },
      relations: [
        'vehicle',
        'driver',
        'school',
        'student',
        'parent',
        'daily_rides',
      ],
      order: { created_at: 'DESC' },
      take: limit,
    });

    return entities.map((ride) => RideMapper.toDomain(ride));
  }
}
