import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from './dto/query-dailyrides.dto';
import { DailyRide } from './domain/daily_rides';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { DailyRideKind, DailyRideStatus } from '../utils/types/enums';
import { RidesService } from '../rides/rides.service';
import { UsersService } from '../users/users.service';
import { UpdateDailyRideDto } from './dto/update-daily_ride.dto';
import { CreateDailyRideDto } from './dto/create-daily_ride.dto';
import { VehicleService } from '../vehicles/vehicles.service';
import { DailyRideRepository } from './infrastructure/persistence/daily_rides.repository';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { VehicleEntity } from '../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { RideEntity } from '../rides/infrastructure/persistence/relational/entities/ride.entity';
import { LocationEntity } from '../location/infrastructure/persistence/relational/entities/location.entity';

interface DriverDashboardResponse {
  status: string;
  rides: DailyRide[];
  total_trips: number;
  upcoming: number;
  pickups: number;
  dropoffs: number;
}

@Injectable()
export class DailyRidesService {
  constructor(
    private readonly dailyRideRepository: DailyRideRepository,
    private readonly ridesService: RidesService,
    private readonly vehiclesService: VehicleService,
    private readonly usersService: UsersService,
  ) {}

  async getDriverDashboard(driverId: number): Promise<DriverDashboardResponse> {
    const today = this.formatDate(new Date());

    // Get today's rides for the driver
    const todayRides = await this.dailyRideRepository.findTodayRidesForDriver(
      driverId,
      today,
    );

    // Get total trips count for the driver
    const totalTrips =
      await this.dailyRideRepository.countTotalTripsForDriver(driverId);

    // Get upcoming trips count (after today)
    const upcomingTrips =
      await this.dailyRideRepository.countUpcomingTripsForDriver(
        driverId,
        today,
      );

    // Count pickups and dropoffs for today
    const pickups = todayRides.filter(
      (ride) => ride.kind === DailyRideKind.Pickup,
    ).length;
    const dropoffs = todayRides.filter(
      (ride) => ride.kind === DailyRideKind.Dropoff,
    ).length;

    return {
      status: 'success',
      rides: todayRides,
      total_trips: totalTrips,
      upcoming: upcomingTrips,
      pickups,
      dropoffs,
    };
  }

  // Helper method to get total trips for a driver
  private async getTotalTripsForDriver(driverId: number): Promise<number> {
    const allTrips = await this.findManyWithPagination({
      filterOptions: { driverId: driverId },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 10000 }, // Large limit to get count
    });
    return allTrips.length;
  }

  // Helper method to get upcoming trips for a driver
  private async getUpcomingTripsForDriver(
    driverId: number,
    today: string,
  ): Promise<number> {
    const upcomingTrips = await this.findManyWithPagination({
      filterOptions: {
        driverId: driverId,
        // Note: You'll need to modify your repository to handle date comparisons
        // For now, we'll get all and filter
      },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 10000 },
    });

    // Filter for dates after today
    const todayDate = new Date(today);
    return upcomingTrips.filter((trip) => {
      const tripDate = new Date(trip.date);
      return tripDate > todayDate;
    }).length;
  }

  // Helper method to format date
  private formatDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  async create(createDailyRideDto: CreateDailyRideDto): Promise<DailyRide> {
    // Validate ride exists
    if (createDailyRideDto.ride?.id) {
      const ride = await this.ridesService.findById(createDailyRideDto.ride.id);
      if (!ride) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { ride: 'rideNotExists' },
        });
      }
    }

    // Validate vehicle exists
    if (createDailyRideDto.vehicle?.id) {
      const vehicle = await this.vehiclesService.findById(
        createDailyRideDto.vehicle.id,
      );
      if (!vehicle) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { vehicle: 'vehicleNotExists' },
        });
      }
    }

    // Validate driver exists (if provided)
    if (createDailyRideDto.driver?.id) {
      const driver = await this.usersService.findById(
        createDailyRideDto.driver.id,
      );
      if (!driver) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { driver: 'driverNotExists' },
        });
      }
    }

    // Validate kind enum
    if (
      createDailyRideDto.kind &&
      !Object.values(DailyRideKind).includes(createDailyRideDto.kind)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { kind: 'invalidKind' },
      });
    }

    // Validate status enum
    if (
      createDailyRideDto.status &&
      !Object.values(DailyRideStatus).includes(createDailyRideDto.status)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'invalidStatus' },
      });
    }

    const dailyRide = this.dailyRideRepository.create({
      kind: createDailyRideDto.kind,
      date: new Date(createDailyRideDto.date),
      start_time: createDailyRideDto.start_time
        ? new Date(createDailyRideDto.start_time)
        : null,
      end_time: createDailyRideDto.end_time
        ? new Date(createDailyRideDto.end_time)
        : null,
      comments: createDailyRideDto.comments ?? null,
      meta: createDailyRideDto.meta ?? null,
      status: createDailyRideDto.status ?? DailyRideStatus.Inactive,

      ride: { id: createDailyRideDto.ride.id } as RideEntity,
      vehicle: { id: createDailyRideDto.vehicle.id } as VehicleEntity,
      driver: createDailyRideDto.driver
        ? ({ id: createDailyRideDto.driver.id } as UserEntity)
        : null,

      locations:
        createDailyRideDto.locations?.map(
          (location) => ({ id: location.id }) as LocationEntity,
        ) ?? [],
    });

    return dailyRide;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterDailyRideDto | null;
    sortOptions?: SortDailyRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<DailyRide[]> {
    return this.dailyRideRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: DailyRide['id']): Promise<NullableType<DailyRide>> {
    return this.dailyRideRepository.findById(id);
  }

  findByIds(ids: DailyRide['id'][]): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByIds(ids);
  }

  findByRideId(rideId: number): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByRideId(rideId);
  }

  findByDriverId(driverId: number): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByDriverId(driverId);
  }

  findByDateRange(startDate: Date, endDate: Date): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByDateRange(startDate, endDate);
  }

  async update(
    id: DailyRide['id'],
    updateDailyRideDto: UpdateDailyRideDto,
  ): Promise<DailyRide | null> {
    // Check if daily ride exists
    const existingDailyRide = await this.dailyRideRepository.findById(id);
    if (!existingDailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          dailyRide: 'dailyRideNotFound',
        },
      });
    }

    // Validate ride exists (if provided)
    if (updateDailyRideDto.ride?.id) {
      const ride = await this.ridesService.findById(updateDailyRideDto.ride.id);
      if (!ride) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            ride: 'rideNotExists',
          },
        });
      }
    }

    // Validate vehicle exists (if provided)
    if (updateDailyRideDto.vehicle?.id) {
      const vehicle = await this.vehiclesService.findById(
        updateDailyRideDto.vehicle.id,
      );
      if (!vehicle) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            vehicle: 'vehicleNotExists',
          },
        });
      }
    }

    // Validate driver exists (if provided)
    if (updateDailyRideDto.driver?.id) {
      const driver = await this.usersService.findById(
        updateDailyRideDto.driver.id,
      );
      if (!driver) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            driver: 'driverNotExists',
          },
        });
      }
    }

    // Validate kind enum (if provided)
    if (
      updateDailyRideDto.kind &&
      !Object.values(DailyRideKind).includes(updateDailyRideDto.kind)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          kind: 'invalidKind',
        },
      });
    }

    // Validate status enum (if provided)
    if (
      updateDailyRideDto.status &&
      !Object.values(DailyRideStatus).includes(updateDailyRideDto.status)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: 'invalidStatus',
        },
      });
    }

    return this.dailyRideRepository.update(id, {
      ride: updateDailyRideDto.ride,
      vehicle: updateDailyRideDto.vehicle,
      driver: updateDailyRideDto.driver,
      kind: updateDailyRideDto.kind,
      date: updateDailyRideDto.date,
      start_time: updateDailyRideDto.start_time,
      end_time: updateDailyRideDto.end_time,
      comments: updateDailyRideDto.comments,
      meta: updateDailyRideDto.meta,
      status: updateDailyRideDto.status,
      locations: updateDailyRideDto.locations,
    });
  }

  async remove(id: DailyRide['id']): Promise<void> {
    const existingDailyRide = await this.dailyRideRepository.findById(id);
    if (!existingDailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          dailyRide: 'dailyRideNotFound',
        },
      });
    }

    await this.dailyRideRepository.remove(id);
  }

  // Additional utility methods specific to daily rides
  async findUpcomingDailyRides(daysAhead: number = 7): Promise<DailyRide[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysAhead);

    return this.findByDateRange(startDate, endDate);
  }

  async findDailyRidesByStatus(status: DailyRideStatus): Promise<DailyRide[]> {
    return this.findManyWithPagination({
      filterOptions: { status },
      sortOptions: [{ orderBy: 'date', order: 'ASC' }],
      paginationOptions: { page: 1, limit: 1000 }, // Large limit to get all
    });
  }

  async startDailyRide(id: DailyRide['id']): Promise<DailyRide | null> {
    return this.update(id, {
      status: DailyRideStatus.Active,
      start_time: new Date().toISOString(),
    });
  }

  async completeDailyRide(id: DailyRide['id']): Promise<DailyRide | null> {
    return this.update(id, {
      status: DailyRideStatus.Finished,
      end_time: new Date().toISOString(),
    });
  }

  async cancelDailyRide(
    id: DailyRide['id'],
    reason?: string,
  ): Promise<DailyRide | null> {
    return this.update(id, {
      status: DailyRideStatus.Finished,
      comments: reason ?? 'Cancelled',
    });
  }
}
