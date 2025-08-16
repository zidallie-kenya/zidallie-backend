import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { RideRepository } from './infrastructure/persistence/ride.repository';
import { UsersService } from '../users/users.service';
import { SchoolsService } from '../schools/schools.service';
import { StudentsService } from '../students/students.service';
import { CreateRideDto } from './dto/create-ride.dto';
import {
  FilterRideDto,
  SortDirection,
  SortRideDto,
} from './dto/query-ride.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Ride } from './domain/rides';
import { NullableType } from '../utils/types/nullable.type';
import { UpdateRideDto } from './dto/update-ride.dto';
import { RideStatus } from '../utils/types/enums';
import { plainToInstance } from 'class-transformer';
import { RideScheduleDto } from './dto/ride-schedule-meta';
import { VehicleService } from '../vehicles/vehicles.service';
import { School } from '../schools/domain/schools';
import { User } from '../users/domain/user';
import { Vehicle } from '../vehicles/domain/vehicles';
import { Student } from '../students/domain/student';

@Injectable()
export class RidesService {
  constructor(
    private readonly rideRepository: RideRepository,
    private readonly vehiclesService: VehicleService,
    private readonly usersService: UsersService,
    private readonly schoolsService: SchoolsService,
    private readonly studentsService: StudentsService,
  ) {}

  // async create(createRideDto: CreateRideDto): Promise<Ride> {
  //   // Validate entities exist but don't load full objects
  //   if (createRideDto.vehicle?.id) {
  //     const vehicle = await this.vehiclesService.findById(
  //       createRideDto.vehicle.id,
  //     );
  //     if (!vehicle) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           vehicle: 'vehicleNotExists',
  //         },
  //       });
  //     }
  //   }

  //   if (createRideDto.driver?.id) {
  //     const driver = await this.usersService.findById(createRideDto.driver.id);
  //     if (!driver) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           driver: 'driverNotExists',
  //         },
  //       });
  //     }
  //   }

  //   if (createRideDto.school?.id) {
  //     const school = await this.schoolsService.findById(
  //       createRideDto.school.id,
  //     );
  //     if (!school) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           school: 'schoolNotExists',
  //         },
  //       });
  //     }
  //   }

  //   if (createRideDto.student?.id) {
  //     const student = await this.studentsService.findById(
  //       createRideDto.student.id,
  //     );
  //     if (!student) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           student: 'studentNotExists',
  //         },
  //       });
  //     }
  //   }

  //   if (createRideDto.parent?.id) {
  //     const parent = await this.usersService.findById(createRideDto.parent.id);
  //     if (!parent) {
  //       throw new UnprocessableEntityException({
  //         status: HttpStatus.UNPROCESSABLE_ENTITY,
  //         errors: {
  //           parent: 'parentNotExists',
  //         },
  //       });
  //     }
  //   }

  //   // Validate status enum
  //   if (
  //     createRideDto.status &&
  //     !Object.values(RideStatus).includes(createRideDto.status)
  //   ) {
  //     throw new UnprocessableEntityException({
  //       status: HttpStatus.UNPROCESSABLE_ENTITY,
  //       errors: {
  //         status: 'invalidStatus',
  //       },
  //     });
  //   }

  //   const schedule: RideScheduleDto | null = createRideDto.schedule
  //     ? plainToInstance(RideScheduleDto, createRideDto.schedule)
  //     : null;

  //   // Create the domain object with just the IDs, not full objects
  //   const rideToCreate = new Ride();
  //   rideToCreate.vehicle = createRideDto.vehicle?.id
  //     ? ({ id: createRideDto.vehicle.id } as Vehicle)
  //     : null;
  //   rideToCreate.driver = createRideDto.driver?.id
  //     ? ({ id: createRideDto.driver.id } as User)
  //     : null;
  //   rideToCreate.school = createRideDto.school?.id
  //     ? ({ id: createRideDto.school.id } as School)
  //     : null;
  //   rideToCreate.student = createRideDto.student?.id
  //     ? ({ id: createRideDto.student.id } as Student)
  //     : null;
  //   rideToCreate.parent = createRideDto.parent?.id
  //     ? ({ id: createRideDto.parent.id } as User)
  //     : null;
  //   rideToCreate.schedule = schedule;
  //   rideToCreate.comments = createRideDto.comments ?? null;
  //   rideToCreate.admin_comments = createRideDto.admin_comments ?? null;
  //   rideToCreate.meta = createRideDto.meta ?? null;
  //   rideToCreate.status = createRideDto.status ?? RideStatus.Requested;
  //   rideToCreate.daily_rides = [];

  //   return this.rideRepository.create(rideToCreate);
  // }
  async create(
    createRideDto: CreateRideDto,
  ): Promise<{ ride: Ride; ride_id: number }> {
    // Simple existence checks without loading full relations to avoid circular mapping
    if (createRideDto.vehicle?.id) {
      const vehicleExists = await this.vehiclesService.existsById(
        createRideDto.vehicle.id,
      );
      console.log(vehicleExists);
      if (!vehicleExists) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            vehicle: 'this vehicle does not exist',
          },
        });
      }
    }

    if (createRideDto.driver?.id) {
      const driver = await this.usersService.findById(createRideDto.driver.id);
      if (!driver) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            driver: 'this driver does not exist',
          },
        });
      }
    }

    if (createRideDto.school?.id) {
      const school = await this.schoolsService.findById(
        createRideDto.school.id,
      );
      if (!school) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            school: 'the school does not exist',
          },
        });
      }
    }

    if (createRideDto.student?.id) {
      const student = await this.studentsService.findById(
        createRideDto.student.id,
      );
      if (!student) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            student: 'the student not exist',
          },
        });
      }
    }

    if (createRideDto.parent?.id) {
      const parent = await this.usersService.findById(createRideDto.parent.id);
      if (!parent) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            parent: 'the parent not exist',
          },
        });
      }
    }

    // Validate status enum
    if (
      createRideDto.status &&
      !Object.values(RideStatus).includes(createRideDto.status)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: 'The hash provided is invalid',
        },
      });
    }

    const schedule: RideScheduleDto | null = createRideDto.schedule
      ? plainToInstance(RideScheduleDto, createRideDto.schedule)
      : null;

    // Create the domain object with just the IDs, not full objects
    const rideToCreate = new Ride();
    rideToCreate.vehicle = createRideDto.vehicle?.id
      ? ({ id: createRideDto.vehicle.id } as Vehicle)
      : null;
    rideToCreate.driver = createRideDto.driver?.id
      ? ({ id: createRideDto.driver.id } as User)
      : null;
    rideToCreate.school = createRideDto.school?.id
      ? ({ id: createRideDto.school.id } as School)
      : null;
    rideToCreate.student = createRideDto.student?.id
      ? ({ id: createRideDto.student.id } as Student)
      : null;
    rideToCreate.parent = createRideDto.parent?.id
      ? ({ id: createRideDto.parent.id } as User)
      : null;
    rideToCreate.schedule = schedule;
    rideToCreate.comments = createRideDto.comments ?? null;
    rideToCreate.admin_comments = createRideDto.admin_comments ?? null;
    rideToCreate.meta = createRideDto.meta ?? null;
    rideToCreate.status = createRideDto.status ?? RideStatus.Requested;
    rideToCreate.daily_rides = [];

    return this.rideRepository.create(rideToCreate);
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterRideDto | null;
    sortOptions?: SortRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Ride[]> {
    return this.rideRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Ride['id']): Promise<NullableType<Ride>> {
    return this.rideRepository.findById(id);
  }

  findByIds(ids: Ride['id'][]): Promise<Ride[]> {
    return this.rideRepository.findByIds(ids);
  }

  findByStudentId(studentId: number): Promise<Ride[]> {
    return this.rideRepository.findByStudentId(studentId);
  }

  findByParentId(parentId: number): Promise<Ride[]> {
    return this.rideRepository.findByParentId(parentId);
  }

  findByDriverId(driverId: number): Promise<Ride[]> {
    return this.rideRepository.findByDriverId(driverId);
  }

  findRecentByDriverId(driverId: number, limit = 10): Promise<Ride[]> {
    return this.rideRepository.findRecentByDriverId(driverId, limit);
  }

  async update(
    id: Ride['id'],
    updateRideDto: UpdateRideDto,
  ): Promise<Ride | null> {
    // Check if ride exists
    const existingRide = await this.rideRepository.findById(id);
    if (!existingRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          ride: 'this ride does not exist',
        },
      });
    }

    // Validate vehicle exists (if provided)
    if (updateRideDto.vehicle?.id) {
      const vehicle = await this.vehiclesService.findById(
        updateRideDto.vehicle.id,
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
    if (updateRideDto.driver?.id) {
      const driver = await this.usersService.findById(updateRideDto.driver.id);
      if (!driver) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            driver: 'this driver does not exist',
          },
        });
      }
    }

    // Validate school exists (if provided)
    if (updateRideDto.school?.id) {
      const school = await this.schoolsService.findById(
        updateRideDto.school.id,
      );
      if (!school) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            school: 'this school does not exist',
          },
        });
      }
    }

    // Validate student exists (if provided)
    if (updateRideDto.student?.id) {
      const student = await this.studentsService.findById(
        updateRideDto.student.id,
      );
      if (!student) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            student: 'this student does not exist',
          },
        });
      }
    }

    // Validate parent exists (if provided)
    if (updateRideDto.parent?.id) {
      const parent = await this.usersService.findById(updateRideDto.parent.id);
      if (!parent) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            parent: 'this parent does not exist',
          },
        });
      }
    }

    // Validate status enum (if provided)
    if (
      updateRideDto.status &&
      !Object.values(RideStatus).includes(updateRideDto.status)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          status: 'The hash provided is invalid',
        },
      });
    }

    return this.rideRepository.update(id, {
      vehicle: updateRideDto.vehicle,
      driver: updateRideDto.driver,
      school: updateRideDto.school,
      student: updateRideDto.student,
      parent: updateRideDto.parent,
      schedule: updateRideDto.schedule,
      comments: updateRideDto.comments,
      admin_comments: updateRideDto.admin_comments,
      meta: updateRideDto.meta,
      status: updateRideDto.status,
      daily_rides: updateRideDto.daily_rides,
    });
  }

  async remove(id: Ride['id']): Promise<void> {
    const existingRide = await this.rideRepository.findById(id);
    if (!existingRide) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          ride: 'Ride not found',
        },
      });
    }

    await this.rideRepository.remove(id);
  }

  // Additional utility methods specific to rides
  async findRidesByStatus(status: RideStatus): Promise<Ride[]> {
    return this.findManyWithPagination({
      filterOptions: { status },
      sortOptions: [{ orderBy: 'created_at', order: SortDirection.DESC }],
      paginationOptions: { page: 1, limit: 1000 }, // Large limit to get all
    });
  }

  async approveRide(
    id: Ride['id'],
    adminComments?: string,
  ): Promise<Ride | null> {
    return this.update(id, {
      status: RideStatus.Requested,
      admin_comments: adminComments ?? 'Ride approved',
    });
  }

  async rejectRide(id: Ride['id'], reason?: string): Promise<Ride | null> {
    return this.update(id, {
      status: RideStatus.Cancelled,
      admin_comments: reason ?? 'Ride rejected',
    });
  }

  async cancelRide(id: Ride['id'], reason?: string): Promise<Ride | null> {
    return this.update(id, {
      status: RideStatus.Cancelled,
      admin_comments: reason ?? 'Ride cancelled',
    });
  }

  async activateRide(id: Ride['id']): Promise<Ride | null> {
    return this.update(id, {
      status: RideStatus.Ongoing,
    });
  }
}
