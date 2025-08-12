import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In, MoreThan } from 'typeorm';
import { DailyRideEntity } from '../entities/daily_ride.entity';
import { DailyRide } from '../../../../domain/daily_rides';
import { DailyRideMapper } from '../mappers/daily_rides.mapper';
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from '../../../../dto/query-dailyrides.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DailyRideRepository } from '../../daily_rides.repository';

// Relations constant to avoid repetition and ensure consistency
const DAILY_RIDE_RELATIONS = [
  'ride',
  'ride.vehicle',
  'ride.driver',
  'ride.school',
  'ride.student',
  'ride.parent',
  'vehicle',
  'driver',
  'locations',
];

@Injectable()
export class DailyRidesRelationalRepository implements DailyRideRepository {
  constructor(
    @InjectRepository(DailyRideEntity)
    private readonly dailyRidesRepository: Repository<DailyRideEntity>,
  ) {}

  async create(data: DailyRide): Promise<DailyRide> {
    const persistenceModel = DailyRideMapper.toPersistence(data);
    const newEntity = await this.dailyRidesRepository.save(
      this.dailyRidesRepository.create(persistenceModel),
    );

    // Reload the entity with all relations including nested ones
    const completeEntity = await this.dailyRidesRepository.findOne({
      where: { id: newEntity.id },
      relations: DAILY_RIDE_RELATIONS,
    });

    if (!completeEntity) {
      throw new Error('Failed to retrieve created daily ride');
    }

    return DailyRideMapper.toDomain(completeEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterDailyRideDto | null;
    sortOptions?: SortDailyRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<DailyRide[]> {
    const where: FindOptionsWhere<DailyRideEntity> = {};

    if (filterOptions?.rideId) {
      where.ride = { id: Number(filterOptions.rideId) };
    }

    if (filterOptions?.vehicleId) {
      where.vehicle = { id: Number(filterOptions.vehicleId) };
    }

    if (filterOptions?.driverId) {
      where.driver = { id: Number(filterOptions.driverId) };
    }

    if (filterOptions?.kind) {
      where.kind = filterOptions.kind;
    }

    if (filterOptions?.status) {
      where.status = filterOptions.status;
    }

    if (filterOptions?.date) {
      // Format date to YYYY-MM-DD string for comparison
      const dateStr =
        filterOptions.date instanceof Date
          ? filterOptions.date.toISOString().split('T')[0]
          : filterOptions.date;
      const dateObj = new Date(dateStr); // Convert string to Date object

      where.date = dateObj;
    }

    const entities = await this.dailyRidesRepository.find({
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
      relations: DAILY_RIDE_RELATIONS,
    });

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  // Add method to count total trips for a driver
  async countTotalTripsForDriver(driverId: number): Promise<number> {
    return await this.dailyRidesRepository.count({
      where: { driver: { id: driverId } },
    });
  }

  // Add method to count upcoming trips for a driver
  async countUpcomingTripsForDriver(
    driverId: number,
    afterDate: string,
  ): Promise<number> {
    const afterDateObj = new Date(afterDate); // Convert string to Date object
    if (isNaN(afterDateObj.getTime())) {
      throw new Error('Invalid date format');
    }
    return await this.dailyRidesRepository.count({
      where: {
        driver: { id: driverId },
        date: MoreThan(afterDateObj),
      },
    });
  }

  // Add method to get today's rides for a driver
  async findTodayRidesForDriver(
    driverId: number,
    date: string,
  ): Promise<DailyRide[]> {
    const dateObj = new Date(date); // Convert string to Date object
    const entities = await this.dailyRidesRepository.find({
      where: {
        driver: { id: driverId },
        date: dateObj,
      },
      order: { start_time: 'ASC' },
      relations: DAILY_RIDE_RELATIONS,
    });

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  async findById(id: DailyRide['id']): Promise<NullableType<DailyRide>> {
    const entity = await this.dailyRidesRepository.findOne({
      where: { id: Number(id) },
      relations: DAILY_RIDE_RELATIONS,
    });

    return entity ? DailyRideMapper.toDomain(entity) : null;
  }

  async findByIds(ids: DailyRide['id'][]): Promise<DailyRide[]> {
    const entities = await this.dailyRidesRepository.find({
      where: { id: In(ids) },
      relations: DAILY_RIDE_RELATIONS,
    });

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  async findByRideId(rideId: number): Promise<DailyRide[]> {
    const entities = await this.dailyRidesRepository.find({
      where: { ride: { id: rideId } },
      relations: DAILY_RIDE_RELATIONS,
    });

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  async findByDriverId(driverId: number): Promise<DailyRide[]> {
    const entities = await this.dailyRidesRepository.find({
      where: { driver: { id: driverId } },
      relations: DAILY_RIDE_RELATIONS,
    });

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<DailyRide[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const entities = await this.dailyRidesRepository
      .createQueryBuilder('daily_ride')
      .where('daily_ride.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      })
      .leftJoinAndSelect('daily_ride.ride', 'ride')
      .leftJoinAndSelect('ride.vehicle', 'ride_vehicle')
      .leftJoinAndSelect('ride.driver', 'ride_driver')
      .leftJoinAndSelect('ride.school', 'ride_school')
      .leftJoinAndSelect('ride.student', 'ride_student')
      .leftJoinAndSelect('ride.parent', 'ride_parent')
      .leftJoinAndSelect('daily_ride.vehicle', 'vehicle')
      .leftJoinAndSelect('daily_ride.driver', 'driver')
      .leftJoinAndSelect('daily_ride.locations', 'locations')
      .getMany();

    return entities.map((dailyRide) => DailyRideMapper.toDomain(dailyRide));
  }

  async update(
    id: DailyRide['id'],
    payload: Partial<DailyRide>,
  ): Promise<DailyRide> {
    const entity = await this.dailyRidesRepository.findOne({
      where: { id: Number(id) },
      relations: DAILY_RIDE_RELATIONS,
    });

    if (!entity) {
      throw new Error('DailyRide not found');
    }

    const updatedEntity = await this.dailyRidesRepository.save(
      this.dailyRidesRepository.create(
        DailyRideMapper.toPersistence({
          ...DailyRideMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    // Reload the updated entity with all relations
    const completeUpdatedEntity = await this.dailyRidesRepository.findOne({
      where: { id: updatedEntity.id },
      relations: DAILY_RIDE_RELATIONS,
    });

    if (!completeUpdatedEntity) {
      throw new Error('Failed to retrieve updated daily ride');
    }

    return DailyRideMapper.toDomain(completeUpdatedEntity);
  }

  async remove(id: DailyRide['id']): Promise<void> {
    await this.dailyRidesRepository.softDelete(id);
  }
}
