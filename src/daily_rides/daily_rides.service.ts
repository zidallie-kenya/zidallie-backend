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
import { ExpoPushService } from './expopush.service';
import { DataSource } from 'typeorm'; // Add for transactions
import { DailyRideEntity } from './infrastructure/persistence/relational/entities/daily_ride.entity';

@Injectable()
export class DailyRidesService {
  constructor(
    private readonly dailyRideRepository: DailyRideRepository,
    private readonly ridesService: RidesService,
    private readonly vehiclesService: VehicleService,
    private readonly usersService: UsersService,
    private readonly expoPushService: ExpoPushService,
    private readonly dataSource: DataSource, // Add for transactions
  ) {}

  // Helper method to format date
  private formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getTodayDate(): Date {
    const now = new Date();
    // Create date at midnight to avoid timezone issues
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
      embark_time: createDailyRideDto.embark_time
        ? new Date(createDailyRideDto.embark_time)
        : null,
      disembark_time: createDailyRideDto.disembark_time
        ? new Date(createDailyRideDto.disembark_time)
        : null,
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
    //the trascation ensures that either all operations succees or if fail, all changes are rolled back
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the driver and validate
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

      const today = this.getTodayDate();
      const driverStartTime = new Date();

      // Use transaction for atomic updates
      const updatedCount = await queryRunner.manager
        .getRepository(DailyRideEntity)
        .createQueryBuilder()
        .update(DailyRideEntity)
        .set({
          status: DailyRideStatus.Started,
          start_time: driverStartTime,
        })
        .where('driver.id = :driverId', { driverId: driver.id })
        .andWhere('date = :date', { date: today })
        .andWhere('status = :currentStatus', {
          currentStatus: DailyRideStatus.Inactive,
        })
        .execute();

      if (updatedCount.affected === 0) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { rides: 'No inactive rides found for today' },
        });
      }

      // Get updated rides
      const updatedRides =
        await this.dailyRideRepository.findTodayRidesForDriver(
          driver.id,
          this.formatDateToString(today),
        );

      await queryRunner.commitTransaction();

      // Send notifications after successful transaction
      await this.sendRideStartNotifications(updatedRides, driver);

      return {
        message: `Started ${updatedCount} daily rides for today`,
        updatedRides,
        driverStartTime,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async sendRideStartNotifications(
    rides: DailyRide[],
    driver: any,
  ): Promise<void> {
    const notificationPromises = rides
      .filter((ride) => ride.ride?.parent?.push_token)
      .map((ride) =>
        this.expoPushService
          .sendPushNotification(
            ride.ride!.parent!.push_token!,
            'Ride Started',
            `Your child's ride has started.`,
            { rideId: ride.id, driverId: driver.id },
          )
          .catch((error) => console.log(error)),
      );

    // Send all notifications concurrently
    await Promise.allSettled(notificationPromises);
  }

  // when driver embarks a student (ride becomes Active)
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

    const embarkTime = new Date();

    const updated = await this.update(id, {
      status: DailyRideStatus.Active,
      start_time: new Date().toISOString(),
      embark_time: embarkTime.toISOString(),
    });

    if (updated?.ride?.parent?.push_token && updated.ride.student?.name) {
      try {
        await this.expoPushService.sendPushNotification(
          updated.ride.parent.push_token,
          'Student Embarked',
          `${updated.ride.student.name} has boarded the vehicle.`,
          { rideId: updated.id },
        );
      } catch (error) {
        console.log(error);
      }
    }

    return updated;
  }

  // when driver disembarks a student (ride becomes Finished)
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

    const disembarkTime = new Date();

    const updated = await this.update(id, {
      status: DailyRideStatus.Finished,
      end_time: new Date().toISOString(),
      disembark_time: disembarkTime.toISOString(),
    });

    if (updated?.ride?.parent?.push_token && updated.ride.student?.name) {
      try {
        await this.expoPushService.sendPushNotification(
          updated.ride.parent.push_token,
          'Student Arrived',
          `${updated.ride.student.name} has reached the destination.`,
          { rideId: updated.id },
        );
      } catch (error) {
        console.log(error);
      }
    }

    return updated;
  }

  async cancelDailyRide(
    id: DailyRide['id'],
    reason?: string,
  ): Promise<DailyRide | null> {
    // validate if the ride exists
    const existingRide = await this.dailyRideRepository.findById(id);

    if (!existingRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { dailyRide: 'Daily ride not found' },
      });
    }

    // Check if ride can be cancelled
    if (existingRide.status === DailyRideStatus.Finished) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: 'Cannot cancel a ride that is already finished',
        },
      });
    }

    // Update the ride status
    let updated: DailyRide | null;
    try {
      updated = await this.update(id, {
        status: DailyRideStatus.Finished,
        comments: reason ?? 'Cancelled',
      });

      if (!updated) {
        throw new Error('Update operation returned null');
      }
    } catch (error) {
      console.log(error);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          cancellation: 'Failed to cancel ride. Please try again.',
        },
      });
    }

    // send notifications
    const notificationPromises: Promise<void>[] = [];

    if (updated.ride?.parent?.push_token) {
      const parentNotification = this.expoPushService.sendPushNotification(
        updated.ride.parent.push_token,
        'Ride Cancelled',
        `Your child's ride was cancelled. Reason: ${reason ?? 'Not specified'}`,
        { rideId: updated.id, type: 'cancellation' },
      );

      notificationPromises.push(parentNotification);
    }

    if (updated.ride?.driver?.push_token) {
      const studentName = updated.ride?.student?.name ?? 'Student';
      const driverNotification = this.expoPushService.sendPushNotification(
        updated.ride.driver.push_token,
        'Ride Cancelled',
        `${studentName}'s ride was cancelled. Reason: ${reason ?? 'Not specified'}`,
        { rideId: updated.id, type: 'cancellation' },
      );

      notificationPromises.push(driverNotification);
    }

    if (notificationPromises.length > 0) {
      Promise.allSettled(notificationPromises)
        .then((results) => {
          const failures = results.filter(
            (result): result is PromiseRejectedResult =>
              result.status === 'rejected',
          ).length;

          if (failures > 0) {
            console.log(
              `${failures} out of ${results.length} notifications failed for cancelled ride ${id}`,
            );
          } else {
            console.log(
              `All notifications sent successfully for cancelled ride ${id}`,
            );
          }
        })
        .catch((error) => {
          console.log(
            `Unexpected error in notification handling for ride ${id}:`,
            error,
          );
        });
    }
    return updated;
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
      embark_time: updateDailyRideDto.embark_time,
      disembark_time: updateDailyRideDto.disembark_time,
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

  async findUpcomingDailyRidesForUser(
    daysAhead: number = 7,
    userJwtPayload: JwtPayloadType,
    status?: DailyRideStatus, // optional
  ): Promise<DailyRide[]> {
    // Get full user details
    const user = await this.usersService.findById(userJwtPayload.id);
    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { user: 'User not found' },
      });
    }

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);

    if (user.kind === 'Driver') {
      return this.dailyRideRepository.findUpcomingRidesForDriver(
        user.id,
        today,
        endDate,
        status, // pass optional status
      );
    } else if (user.kind === 'Parent') {
      // console.log('is parent');
      return this.dailyRideRepository.findUpcomingRidesForParent(
        user.id,
        today,
        endDate,
        status, // pass optional status
      );
    } else {
      return [];
    }
  }

  findDailyRidesByStatus(status: DailyRideStatus): Promise<DailyRide[]> {
    return this.findManyWithPagination({
      filterOptions: { status },
      sortOptions: [{ orderBy: 'date', order: 'ASC' }],
      paginationOptions: { page: 1, limit: 1000 },
    });
  }
  async batchUpdateStatus(
    ids: number[],
    status: DailyRideStatus,
  ): Promise<DailyRide[]> {
    const rides = await this.dailyRideRepository.findByIds(ids);

    if (rides.length === 0) {
      throw new NotFoundException(`No rides found for given IDs`);
    }

    const currentTime = new Date();

    // update statuses
    const updatedRides = rides.map((ride) => {
      ride.status = status;

      // Set embark_time when status changes to Active
      if (status === DailyRideStatus.Active) {
        ride.embark_time = currentTime;
      }

      // Set disembark_time when status changes to Finished
      if (status === DailyRideStatus.Finished) {
        ride.disembark_time = currentTime;
      }
      return ride;
    });

    const savedRides = await this.dailyRideRepository.saveAll(updatedRides);

    // collect Expo push tokens from parent users
    const pushTokens = savedRides
      .map((r) => r.ride?.parent?.push_token)
      .filter(
        (token): token is string =>
          !!token &&
          (token.startsWith('ExpoPushToken') ||
            token.startsWith('ExponentPushToken')),
      );

    // pick notification message based on status
    let message: string;
    switch (status) {
      case DailyRideStatus.Active:
        message = 'Your child has safely boarded and is on their way.';
        break;
      case DailyRideStatus.Finished:
        message = 'Your child has safely arrived at their destination.';
        break;
      default:
        message = `Your ride status is now ${status}`;
    }

    if (pushTokens.length > 0) {
      // send notifications in parallel
      const notificationPromises = pushTokens.map((token) =>
        this.expoPushService
          .sendPushNotification(token, 'Ride Status Updated', message, {
            status,
          })
          .catch((err) => console.error('Push send error:', err)),
      );

      await Promise.allSettled(notificationPromises);
    }

    return savedRides;
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
