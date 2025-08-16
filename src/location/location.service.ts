import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterLocationDto, SortLocationDto } from './dto/query-location.dto';
import { LocationRepository } from './infrastructure/persistence/location.repository';
import { Location } from './domain/location';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { DailyRide } from '../daily_rides/domain/daily_rides';
import { User } from '../users/domain/user';
import { DailyRidesService } from '../daily_rides/daily_rides.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class LocationsService {
  constructor(
    private readonly locationsRepository: LocationRepository,
    private readonly dailyRidesService: DailyRidesService,
    private readonly usersService: UsersService,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    let dailyRide: DailyRide | undefined = undefined;
    if (createLocationDto.dailyRideId) {
      const dailyRideEntity = await this.dailyRidesService.findById(
        createLocationDto.dailyRideId,
      );
      if (!dailyRideEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            dailyRide: 'this dailyRide does not exists',
          },
        });
      }
      dailyRide = dailyRideEntity;
    }

    let driver: User | undefined = undefined;
    if (createLocationDto.driverId) {
      const driverEntity = await this.usersService.findById(
        createLocationDto.driverId,
      );
      if (!driverEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            driver: 'this driver does not exists',
          },
        });
      }
      driver = driverEntity;
    }

    return this.locationsRepository.create({
      latitude: createLocationDto.latitude,
      longitude: createLocationDto.longitude,
      timestamp: new Date(createLocationDto.timestamp),
      daily_ride: dailyRide!,
      driver: driver!,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterLocationDto | null;
    sortOptions?: SortLocationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Location[]> {
    return this.locationsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Location['id']): Promise<NullableType<Location>> {
    return this.locationsRepository.findById(id);
  }

  findByIds(ids: Location['id'][]): Promise<Location[]> {
    return this.locationsRepository.findByIds(ids);
  }

  findByDailyRideId(
    dailyRideId: Location['daily_ride']['id'],
  ): Promise<Location[]> {
    return this.locationsRepository.findByDailyRideId(dailyRideId);
  }

  findByDriverId(driverId: Location['driver']['id']): Promise<Location[]> {
    return this.locationsRepository.findByDriverId(driverId);
  }

  findByTimeRange(startTime: Date, endTime: Date): Promise<Location[]> {
    return this.locationsRepository.findByTimeRange(startTime, endTime);
  }

  findLatestByDriverId(
    driverId: Location['driver']['id'],
  ): Promise<NullableType<Location>> {
    return this.locationsRepository.findLatestByDriverId(driverId);
  }

  async update(
    id: Location['id'],
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location | null> {
    let dailyRide: DailyRide | undefined = undefined;
    if (updateLocationDto.dailyRideId) {
      const dailyRideEntity = await this.dailyRidesService.findById(
        updateLocationDto.dailyRideId,
      );
      if (!dailyRideEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            dailyRide: 'this dailyRide does not exist',
          },
        });
      }
      dailyRide = dailyRideEntity;
    }

    let driver: User | undefined = undefined;
    if (updateLocationDto.driverId) {
      const driverEntity = await this.usersService.findById(
        updateLocationDto.driverId,
      );
      if (!driverEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            driver: 'the driver does not exist',
          },
        });
      }
      driver = driverEntity;
    }

    return this.locationsRepository.update(id, {
      latitude: updateLocationDto.latitude,
      longitude: updateLocationDto.longitude,
      timestamp: updateLocationDto.timestamp,
      daily_ride: dailyRide,
      driver: driver,
    });
  }

  async remove(id: Location['id']): Promise<void> {
    await this.locationsRepository.remove(id);
  }
}
