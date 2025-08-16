import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Ride } from '../../domain/rides';
import { FilterRideDto, SortRideDto } from '../../dto/query-ride.dto';

export abstract class RideRepository {
  abstract create(
    data: Omit<Ride, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<{ ride: Ride; ride_id: number }>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterRideDto | null;
    sortOptions?: SortRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Ride[]>;

  abstract findById(id: Ride['id']): Promise<NullableType<Ride>>;

  abstract findByIds(ids: Ride['id'][]): Promise<Ride[]>;

  abstract findByStudentId(studentId: number): Promise<Ride[]>;

  abstract findByParentId(parentId: number): Promise<Ride[]>;

  abstract findByDriverId(driverId: number): Promise<Ride[]>;

  abstract findRecentByDriverId(
    driverId: number,
    limit?: number,
  ): Promise<Ride[]>;

  abstract update(
    id: Ride['id'],
    payload: DeepPartial<Ride>,
  ): Promise<Ride | null>;

  abstract remove(id: Ride['id']): Promise<void>;
}
