import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VehicleRepository } from './infrastructure/persistence/vehicles.repository';
import { UsersService } from '../users/users.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicle } from './domain/vehicles';
import { User } from '../users/domain/user';
import { FilterVehicleDto, SortVehicleDto } from './dto/query-vehicle.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleType } from '../utils/types/enums';

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly usersService: UsersService, // Optional: for user validation
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Validate user exists if provided
    let user: User | null = null;
    if (createVehicleDto.user?.id) {
      const existingUser = await this.usersService.findById(
        createVehicleDto.user.id,
      );
      if (!existingUser) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotExists',
          },
        });
      }
      user = existingUser;
    }

    // Check for existing vehicle with same registration number
    if (createVehicleDto.registration_number) {
      const existingVehicle =
        await this.vehicleRepository.findByRegistrationNumber(
          createVehicleDto.registration_number,
        );

      if (existingVehicle) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            registration_number: 'registrationNumberAlreadyExists',
          },
        });
      }
    }

    // Validate seat count vs available seats
    if (createVehicleDto.available_seats > createVehicleDto.seat_count) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          available_seats: 'availableSeatsCannotExceedTotalSeats',
        },
      });
    }

    return this.vehicleRepository.create({
      user,
      vehicle_name: createVehicleDto.vehicle_name ?? null,
      registration_number: createVehicleDto.registration_number,
      vehicle_type: createVehicleDto.vehicle_type,
      vehicle_model: createVehicleDto.vehicle_model,
      vehicle_year: createVehicleDto.vehicle_year,
      vehicle_image_url: createVehicleDto.vehicle_image_url ?? null,
      seat_count: createVehicleDto.seat_count,
      available_seats: createVehicleDto.available_seats,
      is_inspected: createVehicleDto.is_inspected ?? false,
      comments: createVehicleDto.comments ?? null,
      meta: createVehicleDto.meta ?? null,
      vehicle_registration: createVehicleDto.vehicle_registration ?? null,
      insurance_certificate: createVehicleDto.insurance_certificate ?? null,
      vehicle_data: createVehicleDto.vehicle_data ?? null,
      status: createVehicleDto.status,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterVehicleDto | null;
    sortOptions?: SortVehicleDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Vehicle[]> {
    return this.vehicleRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Vehicle['id']): Promise<NullableType<Vehicle>> {
    return this.vehicleRepository.findById(id);
  }

  // Add existence check method
  async existsById(id: Vehicle['id']): Promise<boolean> {
    const vehicle = await this.vehicleRepository.findById(id);
    return !!vehicle;
  }

  findByIds(ids: Vehicle['id'][]): Promise<Vehicle[]> {
    return this.vehicleRepository.findByIds(ids);
  }

  findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<NullableType<Vehicle>> {
    return this.vehicleRepository.findByRegistrationNumber(registrationNumber);
  }

  findByUserId(userId: number): Promise<Vehicle[]> {
    return this.vehicleRepository.findByUserId(userId);
  }

  findAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.findAvailableVehicles();
  }

  findByVehicleType(vehicleType: VehicleType): Promise<Vehicle[]> {
    return this.vehicleRepository.findByVehicleType(vehicleType);
  }

  findInspectedVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.findInspectedVehicles();
  }

  findVehiclesWithAvailableSeats(minSeats: number): Promise<Vehicle[]> {
    return this.vehicleRepository.findVehiclesWithAvailableSeats(minSeats);
  }

  searchByModel(searchTerm: string): Promise<Vehicle[]> {
    return this.vehicleRepository.searchByModel(searchTerm);
  }

  async updateAvailableSeats(
    id: Vehicle['id'],
    availableSeats: number,
  ): Promise<Vehicle> {
    const existingVehicle = await this.vehicleRepository.findById(id);

    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate available seats don't exceed total seats
    if (availableSeats > existingVehicle.seat_count) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          available_seats: 'availableSeatsCannotExceedTotalSeats',
        },
      });
    }

    return this.vehicleRepository.updateAvailableSeats(id, availableSeats);
  }

  async update(
    id: Vehicle['id'],
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle | null> {
    const existingVehicle = await this.vehicleRepository.findById(id);

    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate user if provided
    let user: User | null | undefined = undefined;
    if (updateVehicleDto.user?.id) {
      const existingUser = await this.usersService.findById(
        updateVehicleDto.user.id,
      );
      if (!existingUser) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotExists',
          },
        });
      }
      user = existingUser;
    } else if (updateVehicleDto.user === null) {
      user = null;
    }

    // Check for registration number conflicts if being updated
    if (
      updateVehicleDto.registration_number &&
      updateVehicleDto.registration_number !==
        existingVehicle.registration_number
    ) {
      const conflictingVehicle =
        await this.vehicleRepository.findByRegistrationNumber(
          updateVehicleDto.registration_number,
        );

      if (conflictingVehicle && conflictingVehicle.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            registration_number: 'registrationNumberAlreadyExists',
          },
        });
      }
    }

    // Validate seat count vs available seats
    const finalSeatCount =
      updateVehicleDto.seat_count ?? existingVehicle.seat_count;
    const finalAvailableSeats =
      updateVehicleDto.available_seats ?? existingVehicle.available_seats;

    if (finalAvailableSeats > finalSeatCount) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          available_seats: 'availableSeatsCannotExceedTotalSeats',
        },
      });
    }

    return this.vehicleRepository.update(id, {
      user,
      vehicle_name: updateVehicleDto.vehicle_name,
      registration_number: updateVehicleDto.registration_number,
      vehicle_type: updateVehicleDto.vehicle_type,
      vehicle_model: updateVehicleDto.vehicle_model,
      vehicle_year: updateVehicleDto.vehicle_year,
      vehicle_image_url: updateVehicleDto.vehicle_image_url,
      seat_count: updateVehicleDto.seat_count,
      available_seats: updateVehicleDto.available_seats,
      is_inspected: updateVehicleDto.is_inspected,
      comments: updateVehicleDto.comments,
      meta: updateVehicleDto.meta,
      vehicle_registration: updateVehicleDto.vehicle_registration,
      insurance_certificate: updateVehicleDto.insurance_certificate,
      vehicle_data: updateVehicleDto.vehicle_data,
      status: updateVehicleDto.status,
    });
  }

  async remove(id: Vehicle['id']): Promise<void> {
    const existingVehicle = await this.vehicleRepository.findById(id);

    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.vehicleRepository.remove(id);
  }
}
