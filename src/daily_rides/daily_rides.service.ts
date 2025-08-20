import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';

import { DailyRide } from './domain/daily_rides';
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
import { DailyRideKind, DailyRideStatus } from '../utils/types/enums';
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from './dto/query-dailyrides.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { MyRidesResponseDto } from './dto/response.dto';

@Injectable()
export class DailyRidesService {
  constructor(
    private readonly dailyRideRepository: DailyRideRepository,
    private readonly ridesService: RidesService,
    private readonly vehiclesService: VehicleService,
    private readonly usersService: UsersService,
  ) {}

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
          errors: { ride: 'this ride does not exist' },
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
          errors: { vehicle: 'this vehicle does not exist' },
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
          errors: { driver: 'this driver does not exist' },
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
        errors: { kind: 'Invalid kind' },
      });
    }

    // Validate status enum
    if (
      createDailyRideDto.status &&
      !Object.values(DailyRideStatus).includes(createDailyRideDto.status)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'invalid status' },
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

  findByDateRange(startDate: Date, endDate: Date): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByDateRange(startDate, endDate);
  }

  async findMyDailyRides(
    userJwtPayload: JwtPayloadType,
    status?: DailyRideStatus,
  ): Promise<MyRidesResponseDto[]> {
    // Get the full user details to check their kind
    const user = await this.usersService.findById(userJwtPayload.id);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { user: 'User not found' },
      });
    }

    // Determine if user is a driver or parent based on their kind
    const isDriver = user.kind === 'Driver';
    const isParent = user.kind === 'Parent';

    let rides: DailyRide[] = [];

    if (isDriver) {
      // Driver sees their own rides
      rides = await this.dailyRideRepository.findByDriverIdWithStatus(
        user.id,
        status,
      );
    } else if (isParent) {
      // Parent sees rides for their children
      rides = await this.dailyRideRepository.findByParentIdWithStatus(
        user.id,
        status,
      );
    } else {
      // User is neither driver nor parent, return empty array
      rides = [];
    }

    const dailyRides = rides;

    return dailyRides.map((dailyRide) =>
      this.formatDailyRideResponse(dailyRide),
    );
  }

  // mark todays rides as started
  async startDriverDay(userJwtPayload: JwtPayloadType): Promise<{
    message: string;
    updatedRides: DailyRide[];
    driverStartTime: Date;
  }> {
    // Get the driver from JWT token
    const driver = await this.usersService.findById(userJwtPayload.id);

    if (!driver) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { driver: 'Driver not found' },
      });
    }

    if (driver.kind !== 'Driver') {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { user: 'Only drivers can start their day' },
      });
    }

    const today = this.formatDate(new Date());
    const driverStartTime = new Date();

    // Mark ALL today's rides for this driver as Started
    const updatedCount =
      await this.dailyRideRepository.updateAllTodayRidesForDriver(
        driver.id,
        today,
        DailyRideStatus.Started,
        driverStartTime,
      );

    if (updatedCount === 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { rides: 'No inactive rides found for today' },
      });
    }

    // Get all updated rides to return
    const updatedRides = await this.dailyRideRepository.findTodayRidesForDriver(
      driver.id,
      today,
    );

    return {
      message: `Started ${updatedCount} daily rides for today`,
      updatedRides,
      driverStartTime,
    };
  }

  // New method for when driver embarks a student (ride becomes Active)
  async embarkStudent(id: DailyRide['id']): Promise<DailyRide | null> {
    const dailyRide = await this.dailyRideRepository.findById(id);

    if (!dailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { dailyRide: 'Daily ride not found' },
      });
    }

    // Check if ride is in correct status to embark
    if (dailyRide.status !== DailyRideStatus.Started) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: `Cannot embark student. Ride must be in 'Started' status, currently '${dailyRide.status}'`,
        },
      });
    }

    return this.update(id, {
      status: DailyRideStatus.Active,
      start_time: new Date().toISOString(),
    });
  }

  // New method for when driver disembarks a student (ride becomes Finished)
  async disembarkStudent(id: DailyRide['id']): Promise<DailyRide | null> {
    const dailyRide = await this.dailyRideRepository.findById(id);

    if (!dailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { dailyRide: 'Daily ride not found' },
      });
    }

    // Check if ride is in correct status to disembark
    if (dailyRide.status !== DailyRideStatus.Active) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: `Cannot disembark student. Ride must be in 'Active' status, currently '${dailyRide.status}'`,
        },
      });
    }

    return this.update(id, {
      status: DailyRideStatus.Finished,
      end_time: new Date().toISOString(),
    });
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
          dailyRide: 'this daily ride does not exist',
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
            ride: 'this ride does not exist',
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
            vehicle: 'this vehicle does not exist',
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
            driver: 'this driver does not exist',
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
          kind: 'invalid kind',
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
          status: 'invalid status',
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
          dailyRide: 'daily ride not found',
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

  findDailyRidesByStatus(status: DailyRideStatus): Promise<DailyRide[]> {
    return this.findManyWithPagination({
      filterOptions: { status },
      sortOptions: [{ orderBy: 'date', order: 'ASC' }],
      paginationOptions: { page: 1, limit: 1000 }, // Large limit to get all
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

  private formatDailyRideResponse(dailyRide: DailyRide): MyRidesResponseDto {
    return {
      id: dailyRide.id,
      status: dailyRide.status,
      date: dailyRide.date,
      start_time: dailyRide.start_time || new Date(),
      end_time: dailyRide.end_time || new Date(),
      ride: {
        id: dailyRide.ride?.id || 0,
        vehicle: {
          id: dailyRide.ride?.vehicle?.id || 0,
          registration_number:
            dailyRide.ride?.vehicle?.registration_number || '',
          available_seats: dailyRide.ride?.vehicle?.available_seats || 0,
        },
        student: {
          id: dailyRide.ride?.student?.id || 0,
          name: dailyRide.ride?.student?.name || '',
          address: dailyRide.ride?.student?.address || '',
        },
        parent: {
          id: dailyRide.ride?.parent?.id || 0,
          email: dailyRide.ride?.parent?.email || '',
          name: dailyRide.ride?.parent?.name || '',
        },
        schedule: {
          pickup: {
            lat: dailyRide.ride?.schedule?.pickup?.latitude || 0,
            lng: dailyRide.ride?.schedule?.pickup?.longitude || 0,
            time: dailyRide.ride?.schedule?.pickup?.start_time || '',
          },
          dropoff: {
            lat: dailyRide.ride?.schedule?.dropoff?.latitude || 0,
            lng: dailyRide.ride?.schedule?.dropoff?.longitude || 0,
            time: dailyRide.ride?.schedule?.dropoff?.start_time || '',
          },
          kind: dailyRide.ride?.schedule?.kind || '',
        },
      },
    };
  }
}
