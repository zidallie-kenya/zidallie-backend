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
import { S3Service } from '../kyc/s3.service';

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
    files: any,
  ): Promise<Vehicle> {
    console.log('VEHICLE==>Files received in Service:', files);
    // 1. Check if user exists
    const userId =
      typeof createVehicleDto.user === 'string'
        ? JSON.parse(createVehicleDto.user).id
        : createVehicleDto.user?.id;

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnprocessableEntityException({
        errors: { user: 'User not found' },
      });
    }

    // 2. Upload files to S3 in parallel
    const [front, back, inside, insurance, logbook, inspection] =
      await Promise.all([
        this.s3Service.uploadIfPresent(
          files.vehicle_image_url_front,
          'vehicles/front',
        ),
        this.s3Service.uploadIfPresent(
          files.vehicle_image_url_back,
          'vehicles/back',
        ),
        this.s3Service.uploadIfPresent(
          files.vehicle_image_url_inside,
          'vehicles/inside',
        ),
        this.s3Service.uploadIfPresent(
          files.insurance_certificate,
          'vehicles/insurance',
        ),
        this.s3Service.uploadIfPresent(files.logbook, 'vehicles/logbook'),
        this.s3Service.uploadIfPresent(
          files.vehicle_inspection_report,
          'vehicles/inspection',
        ),
      ]);

    // 3. Save to database (Coerce strings from FormData back to Numbers/Booleans)
    return this.vehicleRepository.create({
      ...createVehicleDto,
      user,
      vehicle_image_url_front: front,
      vehicle_image_url_back: back,
      vehicle_image_url_inside: inside,
      insurance_certificate: insurance,
      logbook: logbook,
      vehicle_inspection_report: inspection,
      // Form data arrives as strings; convert to appropriate types
      vehicle_year: Number(createVehicleDto.vehicle_year),
      seat_count: Number(createVehicleDto.seat_count),
      available_seats: Number(createVehicleDto.available_seats),
      is_inspected: String(createVehicleDto.is_inspected) === 'true',
    });
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
            user: 'This user does not exist',
          },
        });
      }
      user = existingUser;

      // Check if user already has a vehicle (excluding the current vehicle being updated)
      const userVehicles = await this.vehicleRepository.findByUserId(
        updateVehicleDto.user.id,
      );
      if (
        userVehicles.length > 0 &&
        userVehicles.some((vehicle) => vehicle.id !== id)
      ) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'This user already has another vehicle assigned',
          },
        });
      }
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
            registration_number: 'This registration number already exists',
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
          available_seats: 'the available seats cannot exceed the total seats',
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
      vehicle_image_url_front: updateVehicleDto.vehicle_image_url_front,
      vehicle_image_url_back: updateVehicleDto.vehicle_image_url_back,
      vehicle_image_url_inside: updateVehicleDto.vehicle_image_url_inside,
      seat_count: updateVehicleDto.seat_count,
      available_seats: updateVehicleDto.available_seats,
      is_inspected: updateVehicleDto.is_inspected,
      comments: updateVehicleDto.comments,
      meta: updateVehicleDto.meta,
      vehicle_registration: updateVehicleDto.vehicle_registration,
      insurance_certificate: updateVehicleDto.insurance_certificate,
      insurance_certificate_expiry:
        updateVehicleDto.insurance_certificate_expiry,
      logbook: updateVehicleDto.logbook,
      vehicle_inspection_report: updateVehicleDto.vehicle_inspection_report,
      vehicle_inspection_expiry: updateVehicleDto.vehicle_inspection_expiry,
      vehicle_data: updateVehicleDto.vehicle_data,
      status: updateVehicleDto.status,
      vehicle_report: updateVehicleDto.vehicle_report,
      minders_name: updateVehicleDto.minders_name,
      minders_id_url: updateVehicleDto.minders_id_url,
    });
  }

  // Other methods remain unchanged
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

    if (availableSeats > existingVehicle.seat_count) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          available_seats: 'the available seats cannot exceed the total seats',
        },
      });
    }

    return this.vehicleRepository.updateAvailableSeats(id, availableSeats);
  }

  async remove(id: Vehicle['id']): Promise<void> {
    const existingVehicle = await this.vehicleRepository.findById(id);

    if (!existingVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.vehicleRepository.remove(id);
  }
}
