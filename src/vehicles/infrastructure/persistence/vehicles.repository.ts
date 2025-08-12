import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Vehicle } from '../../domain/vehicles';
import { FilterVehicleDto, SortVehicleDto } from '../../dto/query-vehicle.dto';
import { EntityManager } from 'typeorm';
import { VehicleType } from '../../../utils/types/enums';

export abstract class VehicleRepository {
  abstract create(
    data: DeepPartial<Vehicle>,
    entityManager?: EntityManager,
  ): Promise<Vehicle>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterVehicleDto | null;
    sortOptions?: SortVehicleDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Vehicle[]>;

  abstract findById(
    id: Vehicle['id'],
    entityManager?: EntityManager,
  ): Promise<NullableType<Vehicle>>;

  abstract existsById(id: Vehicle['id']): Promise<boolean>;

  abstract findByIds(ids: Vehicle['id'][]): Promise<Vehicle[]>;

  abstract findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<NullableType<Vehicle>>;

  abstract findByUserId(userId: number): Promise<Vehicle[]>;

  abstract findAvailableVehicles(): Promise<Vehicle[]>;

  abstract findByVehicleType(vehicleType: VehicleType): Promise<Vehicle[]>;

  abstract findInspectedVehicles(): Promise<Vehicle[]>;

  abstract findVehiclesWithAvailableSeats(minSeats: number): Promise<Vehicle[]>;

  abstract searchByModel(searchTerm: string): Promise<Vehicle[]>;

  abstract updateAvailableSeats(
    id: Vehicle['id'],
    availableSeats: number,
  ): Promise<Vehicle>;

  abstract update(
    id: Vehicle['id'],
    payload: DeepPartial<Vehicle>,
  ): Promise<Vehicle | null>;

  abstract remove(id: Vehicle['id']): Promise<void>;
}

// export abstract class VehicleRepository {
//   abstract create(
//     data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>,
//   ): Promise<Vehicle>;

//   abstract findManyWithPagination({
//     filterOptions,
//     sortOptions,
//     paginationOptions,
//   }: {
//     filterOptions?: FilterVehicleDto | null;
//     sortOptions?: SortVehicleDto[] | null;
//     paginationOptions: IPaginationOptions;
//   }): Promise<Vehicle[]>;

//   abstract findById(id: Vehicle['id']): Promise<NullableType<Vehicle>>;
//   abstract findByIds(ids: Vehicle['id'][]): Promise<Vehicle[]>;
//   abstract findByRegistrationNumber(
//     registrationNumber: string,
//   ): Promise<NullableType<Vehicle>>;
//   abstract findByUserId(userId: number): Promise<Vehicle[]>;
//   abstract findAvailableVehicles(): Promise<Vehicle[]>;
//   abstract findByVehicleType(vehicleType: string): Promise<Vehicle[]>;
//   abstract findInspectedVehicles(): Promise<Vehicle[]>;
//   abstract findVehiclesWithAvailableSeats(minSeats: number): Promise<Vehicle[]>;
//   abstract searchByModel(searchTerm: string): Promise<Vehicle[]>;
//   abstract updateAvailableSeats(
//     id: Vehicle['id'],
//     availableSeats: number,
//   ): Promise<Vehicle>;

//   abstract update(
//     id: Vehicle['id'],
//     payload: DeepPartial<Vehicle>,
//   ): Promise<Vehicle | null>;

//   abstract remove(id: Vehicle['id']): Promise<void>;
// }
