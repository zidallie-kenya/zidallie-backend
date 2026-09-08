import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  forwardRef,
  Inject,
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
import { DataSource, In, Not, IsNull } from 'typeorm';
import { DailyRideEntity } from './infrastructure/persistence/relational/entities/daily_ride.entity';
import { LocationsService } from '../location/location.service';
import { Location } from '../location/domain/location';
import * as pako from 'pako';
import { SubscriptionRepository } from '../subscriptions/infrastructure/persistence/relational/repositories/subscription.repository';
import { SubscriptionService } from '../subscriptions/subscription.service';
import { CreateSubscriptionDto } from '../subscriptions/dto/create-subscription.dto';
import { isNumber } from 'class-validator';

// Notification copy — keep in one place so the four driver-triggered
// moments (start, board, absent, drop-off) stay consistent everywhere
// they're sent from.
const NOTIFICATIONS = {
  TRIP_STARTED:
    'Zidallie school transport has started, Please have your child ready.',
  EMBARKED: 'Your child has safely boarded and is on their way.',
  ABSENT: 'Absent - your child was absent for the trip',
  DISEMBARKED: 'Your child has safely arrived at their destination.',
};

@Injectable()
export class DailyRidesService {
  constructor(
    private readonly dailyRideRepository: DailyRideRepository,
    private readonly ridesService: RidesService,
    private readonly vehiclesService: VehicleService,
    private readonly usersService: UsersService,
    private readonly expoPushService: ExpoPushService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionService: SubscriptionService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => LocationsService))
    private readonly locationsService: LocationsService,
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
      embark_latitude: createDailyRideDto.embark_latitude ?? null,
      embark_longitude: createDailyRideDto.embark_longitude ?? null,
      disembark_latitude: createDailyRideDto.disembark_latitude ?? null,
      disembark_longitude: createDailyRideDto.disembark_longitude ?? null,
      route_data: createDailyRideDto.route_data ?? null,
      earnings_processed: createDailyRideDto.earnings_processed ?? false,
      snapshot_subscription_id:
        createDailyRideDto.snapshot_subscription_id ?? null,
      had_active_subscription:
        createDailyRideDto.had_active_subscription ?? false,
      start_latitude: createDailyRideDto.start_latitude ?? null,
      start_longitude: createDailyRideDto.start_longitude ?? null,
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

  async findOngoingRideForDriver(
    driverId: number,
  ): Promise<NullableType<DailyRide>> {
    const driver = await this.usersService.findById(driverId);

    if (!driver) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { driver: 'Driver not found' },
      });
    }

    if (driver.kind !== 'Driver') {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { driver: 'User is not a driver' },
      });
    }

    return this.dailyRideRepository.findActiveRideByDriverId(driverId);
  }

  findByDateRange(startDate: Date, endDate: Date): Promise<DailyRide[]> {
    return this.dailyRideRepository.findByDateRange(startDate, endDate);
  }

  async findMyDailyRides(
    userJwtPayload: JwtPayloadType,
    status?: DailyRideStatus,
  ): Promise<MyRidesResponseDto[]> {
    const user = await this.usersService.findById(userJwtPayload.id);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { user: 'User not found' },
      });
    }

    const isDriver = user.kind === 'Driver';
    const isParent = user.kind === 'Parent';

    let rides: DailyRide[] = [];

    if (isDriver) {
      rides = await this.dailyRideRepository.findByDriverIdWithStatus(
        user.id,
        status,
      );
    } else if (isParent) {
      rides = await this.dailyRideRepository.findByParentIdWithStatus(
        user.id,
        status,
      );
    } else {
      rides = [];
    }

    const dailyRides = rides;

    return dailyRides.map((dailyRide) =>
      this.formatDailyRideResponse(dailyRide),
    );
  }

  // ── STEP 1: driver taps "Start Trip" ────────────────────────────────
  // Marks today's Inactive rides of the given kind (Pickup for the
  // morning leg, Dropoff for the evening leg) Started, stamps
  // start_time, and tells every parent on that leg to get their child
  // ready.
  // async startDriverDay(
  //   userJwtPayload: JwtPayloadType,
  //   kind: DailyRideKind,
  // ): Promise<{
  //   message: string;
  //   updatedRides: DailyRide[];
  //   driverStartTime: Date;
  // }> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const driver = await this.usersService.findById(userJwtPayload.id);

  //     if (!driver) {
  //       throw new NotFoundException({
  //         status: HttpStatus.NOT_FOUND,
  //         errors: { driver: 'Driver not found' },
  //       });
  //     }

  //     if (driver.kind !== 'Driver') {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: { user: 'Only drivers can start their day' },
  //       });
  //     }

  //     if (!Object.values(DailyRideKind).includes(kind)) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: { kind: 'Invalid kind — expected Pickup or Dropoff' },
  //       });
  //     }

  //     const today = this.getTodayDate();
  //     const driverStartTime = new Date();

  //     const updatedCount = await queryRunner.manager
  //       .getRepository(DailyRideEntity)
  //       .createQueryBuilder()
  //       .update(DailyRideEntity)
  //       .set({
  //         status: DailyRideStatus.Started,
  //         start_time: driverStartTime,
  //       })
  //       .where('driver.id = :driverId', { driverId: driver.id })
  //       .andWhere('date = :date', { date: today })
  //       .andWhere('kind = :kind', { kind })
  //       .andWhere('status = :currentStatus', {
  //         currentStatus: DailyRideStatus.Inactive,
  //       })
  //       .execute();

  //     if (updatedCount.affected === 0) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           rides: `No inactive ${kind} rides found for today`,
  //         },
  //       });
  //     }

  //     const updatedRides = (
  //       await this.dailyRideRepository.findTodayRidesForDriver(
  //         driver.id,
  //         this.formatDateToString(today),
  //       )
  //     ).filter((r) => r.kind === kind);

  //     await queryRunner.commitTransaction();

  //     void this.sendRideStartNotifications(updatedRides, driver);

  //     return {
  //       message: `Started ${updatedCount.affected} daily rides for today`,
  //       updatedRides,
  //       driverStartTime,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }
  async startDriverDay(
    userJwtPayload: JwtPayloadType,
    kind: DailyRideKind,
  ): Promise<{
    message: string;
    updatedRides: DailyRide[];
    driverStartTime: Date;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const driver = await this.usersService.findById(userJwtPayload.id);

      if (!driver || driver.kind !== 'Driver') {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { user: 'Only drivers can start their day' },
        });
      }

      const today = this.getTodayDate();
      const driverStartTime = new Date();

      // 1. Attempt to update Inactive rides to Started
      const updateResult = await queryRunner.manager
        .getRepository(DailyRideEntity)
        .createQueryBuilder()
        .update(DailyRideEntity)
        .set({
          status: DailyRideStatus.Started,
          start_time: driverStartTime,
        })
        .where('driver.id = :driverId', { driverId: driver.id })
        .andWhere('date = :date', { date: today })
        .andWhere('kind = :kind', { kind })
        .andWhere('status = :currentStatus', {
          currentStatus: DailyRideStatus.Inactive,
        })
        .execute();

      // FIX: Extract affected rows and default to 0 to satisfy TypeScript
      const rowsAffected = updateResult.affected ?? 0;

      // 2. Fetch the current state of today's rides for this driver/kind
      const allRelevantRides = (
        await this.dailyRideRepository.findTodayRidesForDriver(
          driver.id,
          this.formatDateToString(today),
        )
      ).filter((r) => r.kind === kind);

      // 3. IDEMPOTENCY CHECK:
      // If rowsAffected is 0, it might be because they were already started.
      if (rowsAffected === 0) {
        const alreadyInProgress = allRelevantRides.some(
          (r) =>
            r.status === DailyRideStatus.Started ||
            r.status === DailyRideStatus.Active ||
            r.status === DailyRideStatus.Finished,
        );

        if (!alreadyInProgress) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: { rides: `No rides found for today's ${kind} trip.` },
          });
        }
      }

      await queryRunner.commitTransaction();

      // Only send notifications if we actually moved rides from Inactive to Started
      if (rowsAffected > 0) {
        void this.sendRideStartNotifications(allRelevantRides, driver);
      }

      return {
        message:
          rowsAffected > 0
            ? `Started ${rowsAffected} daily rides.`
            : `Trip is already in progress.`,
        updatedRides: allRelevantRides,
        driverStartTime: allRelevantRides[0]?.start_time || driverStartTime,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
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
            'Trip Started',
            NOTIFICATIONS.TRIP_STARTED,
            { rideId: ride.id, driverId: driver.id },
          )
          .catch((error) => console.log(error)),
      );

    void Promise.allSettled(notificationPromises);
  }

  // ── STEP 2: driver taps ✓ (present) ─────────────────────────────────
  // Full subscription / instant-payment handling from batchUpdateStatus's
  // Active branch, run per-child at embark time.
  async embarkStudent(
    id: DailyRide['id'],
    payment_phone_number?: string,
    amount_to_pay?: number,
  ): Promise<DailyRide | null> {
    const dailyRide = await this.dailyRideRepository.findById(id);

    if (!dailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { dailyRide: 'Daily ride not found' },
      });
    }

    if (
      dailyRide.status !== DailyRideStatus.Started &&
      dailyRide.status !== DailyRideStatus.Active
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: `Cannot embark student. Current status is ${dailyRide.status}`,
        },
      });
    }

    const embarkTime = new Date();

    let latestLocation: Location | null = null;
    if (dailyRide.driver?.id) {
      latestLocation = await this.locationsService.findLatestByDriverId(
        dailyRide.driver.id,
      );
    }

    let hadActiveSubscription = dailyRide.had_active_subscription ?? false;
    let snapshotSubscriptionId = dailyRide.snapshot_subscription_id ?? null;

    const student = dailyRide.ride?.student;
    if (student?.id) {
      const activeSub =
        await this.subscriptionRepository.checkActiveStatusByDate(
          student.id,
          embarkTime,
        );
      const hasActiveSub = isNumber(activeSub?.id);

      if (student.service_type === 'instant_payment') {
        if (hasActiveSub) {
          hadActiveSubscription = true;
          snapshotSubscriptionId = activeSub!.id;
        } else {
          hadActiveSubscription = false;
          snapshotSubscriptionId = null;

          const dto = new CreateSubscriptionDto();
          const student_daily_amount = student?.daily_fee ?? 0;
          dto.student_id = student.id;

          if ((amount_to_pay ?? 0) < student_daily_amount) {
            throw new NotFoundException({
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                amount:
                  'Amount cannot be less than the daily amount of ' +
                  student_daily_amount,
              },
            });
          }
          if (!payment_phone_number) {
            throw new NotFoundException({
              status: HttpStatus.UNPROCESSABLE_ENTITY,
              errors: {
                phone_number: 'Provide a valid phone Number to proceed',
              },
            });
          }

          dto.amount = amount_to_pay!;
          dto.isInstantPayment = true;
          dto.daily_ride_id = dailyRide.id;
          dto.phone_number = payment_phone_number;

          try {
            await this.subscriptionService.initiatePayment(dto);
          } catch (e) {
            console.error('Instant payment failed for student', student.id, e);
          }
        }
      } else {
        hadActiveSubscription = hasActiveSub;
        snapshotSubscriptionId = hasActiveSub ? activeSub!.id : null;
      }
    }

    const updated = await this.update(id, {
      status: DailyRideStatus.Active,
      embark_time: embarkTime.toISOString(),
      embark_latitude: latestLocation?.latitude,
      embark_longitude: latestLocation?.longitude,
      had_active_subscription: hadActiveSubscription,
      snapshot_subscription_id: snapshotSubscriptionId,
    });

    if (updated?.ride?.parent?.push_token) {
      try {
        void this.expoPushService.sendPushNotification(
          updated.ride.parent.push_token,
          'Student Boarded',
          NOTIFICATIONS.EMBARKED,
          { rideId: updated.id },
        );
      } catch (error) {
        console.log(error);
      }
    }

    return updated;
  }

  // ── STEP 2 (alt): driver taps ✕ (absent) ────────────────────────────
  // No drop-off is expected, so the ride goes straight to Finished.
  async cancelDailyRide(
    id: DailyRide['id'],
    reason?: string,
  ): Promise<DailyRide | null> {
    const existingRide = await this.dailyRideRepository.findById(id);

    if (!existingRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { dailyRide: 'Daily ride not found' },
      });
    }

    if (existingRide.status === DailyRideStatus.Finished) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: 'Cannot cancel a ride that is already finished',
        },
      });
    }

    let updated: DailyRide | null;
    try {
      updated = await this.update(id, {
        status: DailyRideStatus.Finished,
        comments: reason ?? 'Marked absent by driver',
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

    const notificationPromises: Promise<void>[] = [];

    if (updated.ride?.parent?.push_token) {
      notificationPromises.push(
        this.expoPushService.sendPushNotification(
          updated.ride.parent.push_token,
          'Marked Absent',
          NOTIFICATIONS.ABSENT,
          { rideId: updated.id, type: 'absent' },
        ),
      );
    }

    if (notificationPromises.length > 0) {
      Promise.allSettled(notificationPromises).catch((error) =>
        console.log(
          `Unexpected error sending absent notification for ride ${id}:`,
          error,
        ),
      );
    }

    return updated;
  }

  // ── STEP 3: driver taps "End Trip — [Child]" ────────────────────────
  // Same earnings + route-compression logic batchUpdateStatus ran for
  // the Finished status, now run per-child at disembark time, plus the
  // weekly pending_earnings reset check that batchUpdateStatus also did.
  // async disembarkStudent(id: DailyRide['id']): Promise<DailyRide | null> {
  //   const updatedRide = await this.dataSource.transaction(
  //     async (transactionalEntityManager) => {
  //       const dailyRide = await transactionalEntityManager.findOne(
  //         DailyRideEntity,
  //         {
  //           where: { id },
  //           relations: ['driver', 'ride', 'ride.parent', 'ride.student'],
  //         },
  //       );

  //       if (!dailyRide || dailyRide.status !== DailyRideStatus.Active) {
  //         throw new UnprocessableEntityException(
  //           'Ride not found or not active',
  //         );
  //       }

  //       if (!dailyRide?.driver?.id) {
  //         throw new UnprocessableEntityException(
  //           'Driver id for this ride not found',
  //         );
  //       }

  //       const disembarkTime = new Date();

  //       // Get Coordinates
  //       const latestLocation = await this.locationsService.findLatestByDriverId(
  //         dailyRide.driver.id,
  //       );
  //       const disembark_lat = latestLocation?.latitude ?? null;
  //       const disembark_long = latestLocation?.longitude ?? null;

  //       // Process Route Data
  //       // const locations =
  //       //   await this.locationsService.findByDailyRideIdInTimeRange(
  //       //     id,
  //       //     dailyRide.embark_time ?? disembarkTime,
  //       //     disembarkTime,
  //       //   );

  //       // const routeSnapshot = locations.map((loc) => ({
  //       //   lat: loc.latitude,
  //       //   lng: loc.longitude,
  //       //   ts: loc.timestamp,
  //       // }));

  //       // const compressedString = Buffer.from(
  //       //   pako.gzip(JSON.stringify(routeSnapshot)),
  //       // ).toString('base64');

  //       const saved = await transactionalEntityManager.save(DailyRideEntity, {
  //         ...dailyRide,
  //         status: DailyRideStatus.Finished,
  //         disembark_time: disembarkTime,
  //         disembark_latitude: disembark_lat,
  //         disembark_longitude: disembark_long,
  //         // route_data: compressedString,
  //       });

  //       await this.locationsService.deleteManyByDailyRideId(id);

  //       return saved;
  //     },
  //   );

  //   const full = await this.dailyRideRepository.findById(id);
  //   if (full?.ride?.parent?.push_token) {
  //     try {
  //       void this.expoPushService.sendPushNotification(
  //         full.ride.parent.push_token,
  //         'Student Dropped Off',
  //         NOTIFICATIONS.DISEMBARKED,
  //         { rideId: full.id },
  //       );
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }

  //   return full ?? updatedRide;
  // }

  async disembarkStudent(id: DailyRide['id']): Promise<DailyRide | null> {
    const updatedRide = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const dailyRide = await transactionalEntityManager.findOne(
          DailyRideEntity,
          {
            where: { id },
            relations: ['driver', 'ride', 'ride.parent', 'ride.student'],
          },
        );

        if (!dailyRide) {
          throw new NotFoundException('Ride not found');
        }

        // 1. IDEMPOTENCY: If the ride is already Finished, just return it.
        // This prevents the "Failed to close out" error on double-taps.
        if (dailyRide.status === DailyRideStatus.Finished) {
          return dailyRide;
        }

        if (dailyRide.status !== DailyRideStatus.Active) {
          throw new UnprocessableEntityException(
            `Cannot end trip. Ride status is ${dailyRide.status}, expected Active.`,
          );
        }

        if (!dailyRide?.driver?.id) {
          throw new UnprocessableEntityException('Driver ID not found.');
        }

        const disembarkTime = new Date();
        const latestLocation = await this.locationsService.findLatestByDriverId(
          dailyRide.driver.id,
        );

        const saved = await transactionalEntityManager.save(DailyRideEntity, {
          ...dailyRide,
          status: DailyRideStatus.Finished,
          disembark_time: disembarkTime,
          disembark_latitude: latestLocation?.latitude ?? null,
          disembark_longitude: latestLocation?.longitude ?? null,
        });

        // 2. Wrap location cleanup in try/catch so failure here
        // doesn't crash the entire disembark process.
        try {
          await this.locationsService.deleteManyByDailyRideId(id);
        } catch (e) {
          console.error(
            `Non-critical error: Failed to delete locations for ride ${id}`,
            e,
          );
        }

        return saved;
      },
    );

    // Send notification...
    if (updatedRide?.ride?.parent?.push_token) {
      try {
        void this.expoPushService.sendPushNotification(
          updatedRide.ride.parent.push_token,
          'Student Dropped Off',
          NOTIFICATIONS.DISEMBARKED,
          { rideId: updatedRide.id },
        );
      } catch (error) {
        console.log('Notification error:', error);
      }
    }

    return updatedRide;
  }

  // ── STEP 4: driver taps the main "End Trip" button ──────────────────
  // Every child has been resolved (marked + present ones dropped off).
  // Close out today's rides for this leg and settle the weekly earnings
  // reset batchUpdateStatus used to run inline on every Finished ride.
  async endDriverDay(
    userJwtPayload: JwtPayloadType,
    kind: DailyRideKind,
  ): Promise<{
    message: string;
    updatedRides: DailyRide[];
    driverEndTime: Date;
  }> {
    const driver = await this.usersService.findById(userJwtPayload.id);

    if (!driver || driver.kind !== 'Driver') {
      throw new UnprocessableEntityException('Only drivers can end their day');
    }

    const today = this.getTodayDate();
    const driverEndTime = new Date();

    return await this.dataSource.transaction(async (manager) => {
      const ridesToProcess = await manager.find(DailyRideEntity, {
        where: {
          driver: { id: driver.id },
          date: today,
          kind: kind,
          status: DailyRideStatus.Finished,
          end_time: IsNull(),
        },
        relations: ['driver'],
      });

      // Nothing left to close out for this leg — figure out whether that's
      // because the day was already ended, so we can short-circuit instead
      // of re-running the earnings/notification logic.
      if (ridesToProcess.length === 0) {
        const alreadyEndedRide = await manager.findOne(DailyRideEntity, {
          where: {
            driver: { id: driver.id },
            date: today,
            kind: kind,
            status: DailyRideStatus.Finished,
            end_time: Not(IsNull()),
          },
          order: { end_time: 'DESC' },
        });

        if (alreadyEndedRide) {
          const updatedRides = (
            await this.dailyRideRepository.findTodayRidesForDriver(
              driver.id,
              this.formatDateToString(today),
            )
          ).filter((r) => r.kind === kind);

          return {
            message: `Trip for today's ${kind} was already ended.`,
            updatedRides,
            driverEndTime: alreadyEndedRide.end_time as Date,
          };
        }
      }

      let totalEarningsForLeg = 0;

      for (const ride of ridesToProcess) {
        if (
          !ride.earnings_processed &&
          driver.payout &&
          driver.sasapay_account_number
        ) {
          const amountToEarn = this.EarningsHelper.calculatePerRide(
            driver.payout.payment_model,
            Number(driver.payout.agreed_salary),
          );
          totalEarningsForLeg += amountToEarn;
        }

        await manager.update(DailyRideEntity, ride.id, {
          end_time: driverEndTime,
          earnings_processed: true,
        });
      }

      if (totalEarningsForLeg > 0) {
        await this.usersService.incrementPendingEarnings(
          driver.id,
          totalEarningsForLeg,
        );
      }

      const updatedRides = (
        await this.dailyRideRepository.findTodayRidesForDriver(
          driver.id,
          this.formatDateToString(today),
        )
      ).filter((r) => r.kind === kind);

      return {
        message: `Trip ended. Processed earnings for ${ridesToProcess.length} student(s).`,
        updatedRides,
        driverEndTime,
      };
    });
  }

  async update(
    id: DailyRide['id'],
    updateDailyRideDto: UpdateDailyRideDto,
  ): Promise<DailyRide | null> {
    const existingDailyRide = await this.dailyRideRepository.findById(id);
    if (!existingDailyRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          dailyRide: 'this daily ride does not exist',
        },
      });
    }

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
      embark_latitude: updateDailyRideDto.embark_latitude,
      embark_longitude: updateDailyRideDto.embark_longitude,
      disembark_latitude: updateDailyRideDto.disembark_latitude,
      disembark_longitude: updateDailyRideDto.disembark_longitude,
      route_data: updateDailyRideDto.route_data,
      earnings_processed: updateDailyRideDto.earnings_processed,
      had_active_subscription: updateDailyRideDto.had_active_subscription,
      snapshot_subscription_id: updateDailyRideDto.snapshot_subscription_id,
      start_latitude: updateDailyRideDto.start_latitude,
      start_longitude: updateDailyRideDto.start_longitude,
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

  async findUpcomingDailyRides(daysAhead: number = 7): Promise<DailyRide[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysAhead);

    return this.findByDateRange(startDate, endDate);
  }

  async findUpcomingDailyRidesForUser(
    daysAhead: number = 7,
    userJwtPayload: JwtPayloadType,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]> {
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
        status,
      );
    } else if (user.kind === 'Parent') {
      return this.dailyRideRepository.findUpcomingRidesForParent(
        user.id,
        today,
        endDate,
        status,
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

  // Retained for admin/dispatch use (e.g. bulk corrections) — the driver
  // app now drives status changes one child at a time via embarkStudent /
  // disembarkStudent / cancelDailyRide above, which is where the
  // subscription, earnings, and weekly-reset logic now lives.
  async batchUpdateStatus(
    ids: number[],
    payment_phone_number: any,
    amount_to_pay: any,
    status: DailyRideStatus,
  ): Promise<DailyRide[]> {
    const rides = await this.dailyRideRepository.findByIds(ids);
    if (rides.length === 0) {
      throw new NotFoundException(`No rides found for given IDs`);
    }

    const currentTime = new Date();
    const mostRecentMonday = this.getMostRecentMonday();

    const ridesToSave: DailyRide[] = [];
    const driversToReset = new Set<number>();
    const earningsToIncrement: Map<number, number> = new Map();

    for (const ride of rides) {
      ride.status = status;

      if (status === DailyRideStatus.Active) {
        ride.embark_time = currentTime;

        if (ride.ride?.student?.id) {
          const student = ride.ride.student;

          const activeSub =
            await this.subscriptionRepository.checkActiveStatusByDate(
              ride.ride.student.id,
              currentTime,
            );
          const hasActiveSub = isNumber(activeSub?.id);

          if (student.service_type === 'instant_payment') {
            if (hasActiveSub) {
              ride.had_active_subscription = hasActiveSub;
              ride.snapshot_subscription_id = hasActiveSub
                ? activeSub.id
                : null;
            } else {
              ride.had_active_subscription = false;
              ride.snapshot_subscription_id = null;
              const dto = new CreateSubscriptionDto();
              const student_daily_amount = student?.daily_fee ?? 0;
              dto.student_id = student.id;
              if (amount_to_pay < student_daily_amount) {
                throw new NotFoundException({
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: {
                    amount:
                      'Amount cannot be less than the daily amount of ' +
                      student_daily_amount,
                  },
                });
              }
              if (!payment_phone_number) {
                throw new NotFoundException({
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: {
                    phone_number: 'Provide a valid phone Number to proceed',
                  },
                });
              }
              dto.amount = amount_to_pay;
              dto.isInstantPayment = true;
              dto.daily_ride_id = ride.id;
              dto.phone_number = payment_phone_number || '';

              try {
                await this.subscriptionService.initiatePayment(dto);
              } catch (e) {
                console.error(
                  'Instant payment failed for student',
                  student.id,
                  e,
                );
              }
            }
          } else {
            ride.had_active_subscription = hasActiveSub;
            ride.snapshot_subscription_id = activeSub ? activeSub.id : null;
          }
        }

        const latestLocation = await this.locationsService.findLatestByDriverId(
          ride.driver?.id ?? 0,
        );
        ride.embark_latitude = latestLocation?.latitude ?? null;
        ride.embark_longitude = latestLocation?.longitude ?? null;
      }

      if (status === DailyRideStatus.Finished) {
        ride.disembark_time = currentTime;

        const latestLocation = await this.locationsService.findLatestByDriverId(
          ride.driver?.id ?? 0,
        );
        ride.disembark_latitude = latestLocation?.latitude ?? null;
        ride.disembark_longitude = latestLocation?.longitude ?? null;

        const locations: any = [];
        const routeSnapshot = locations.map((loc) => ({
          lat: loc.latitude,
          lng: loc.longitude,
          ts: loc.timestamp,
        }));

        ride.route_data = Buffer.from(
          pako.gzip(JSON.stringify(routeSnapshot)),
        ).toString('base64');

        if (ride.driver?.payout && !ride.earnings_processed) {
          const salary = Number(ride.driver.payout.agreed_salary);

          const amount = this.EarningsHelper.calculatePerRide(
            ride.driver.payout.payment_model,
            salary,
          );

          earningsToIncrement.set(
            ride.driver.id,
            (earningsToIncrement.get(ride.driver.id) || 0) + amount,
          );
          ride.earnings_processed = true;
        }

        if (ride.driver) {
          const lastReset = ride.driver.last_earnings_reset_at;
          if (!lastReset || new Date(lastReset) < mostRecentMonday) {
            driversToReset.add(ride.driver.id);
          }
        }
      }
      ridesToSave.push(ride);
    }

    return await this.dataSource.transaction(async (manager) => {
      for (const driverId of driversToReset) {
        await manager.update(UserEntity, driverId, {
          pending_earnings: 0,
          last_earnings_reset_at: currentTime,
        });
      }

      for (const [driverId, amount] of earningsToIncrement) {
        await manager.increment(
          UserEntity,
          { id: driverId },
          'pending_earnings',
          amount,
        );
      }

      for (const ride of ridesToSave) {
        if (
          ride.ride?.student?.service_type === 'instant_payment' &&
          !ride.had_active_subscription &&
          status === DailyRideStatus.Active
        ) {
          continue;
        }
        await manager.update(DailyRideEntity, ride.id, {
          status: ride.status,
          embark_time: ride.embark_time,
          disembark_time: ride.disembark_time,
          embark_latitude: ride.embark_latitude,
          embark_longitude: ride.embark_longitude,
          disembark_latitude: ride.disembark_latitude,
          disembark_longitude: ride.disembark_longitude,
          route_data: ride.route_data,
          earnings_processed: ride.earnings_processed,
          had_active_subscription: ride.had_active_subscription,
          snapshot_subscription_id: ride.snapshot_subscription_id,
        });
      }

      if (status === DailyRideStatus.Finished) {
        await manager.delete(LocationEntity, { daily_ride: { id: In(ids) } });
      }

      this.sendBatchNotifications(ridesToSave, status);
      return ridesToSave;
    });
  }

  private sendBatchNotifications(rides: DailyRide[], status: DailyRideStatus) {
    if (
      rides.every(
        (ride) =>
          ride.ride?.student?.service_type === 'instant_payment' &&
          status === DailyRideStatus.Active &&
          !ride.had_active_subscription,
      )
    ) {
      return;
    }
    const pushTokens = rides
      .map((r) => r.ride?.parent?.push_token)
      .filter((token): token is string => !!token && token.startsWith('Expo'));

    const message =
      status === DailyRideStatus.Active
        ? NOTIFICATIONS.EMBARKED
        : NOTIFICATIONS.DISEMBARKED;

    if (pushTokens.length > 0) {
      const promises = pushTokens.map((token) =>
        this.expoPushService.sendPushNotification(
          token,
          'Ride Update',
          message,
          { status },
        ),
      );
      Promise.allSettled(promises).catch((e) =>
        console.error('Notification Error', e),
      );
    }
  }

  async exists(id: number): Promise<boolean> {
    return this.dailyRideRepository.exists(id);
  }

  private formatDailyRideResponse(dailyRide: DailyRide): MyRidesResponseDto {
    return {
      id: dailyRide.id,
      status: dailyRide.status,
      date: dailyRide.date,
      start_latitude: dailyRide.start_latitude || null,
      start_longitude: dailyRide.start_longitude || null,
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
          service_type: dailyRide.ride?.student?.service_type || 'carpool',
          daily_fee: dailyRide.ride?.student?.daily_fee || 0,
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

  private EarningsHelper = {
    calculatePerRide: (model: 'weekly' | 'monthly', salary: number): number => {
      const ridesPerPeriod = model === 'weekly' ? 10 : 40;
      return salary / ridesPerPeriod;
    },

    isPayoutDay: (model: 'weekly' | 'monthly'): boolean => {
      const now = new Date();
      if (model === 'weekly') {
        return now.getDay() === 6 || now.getDay() === 0; // Sat/Sun
      } else {
        const tomorrow = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );
        return tomorrow.getDate() === 1; // Last day of month
      }
    },
  };

  private getMostRecentMonday(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
