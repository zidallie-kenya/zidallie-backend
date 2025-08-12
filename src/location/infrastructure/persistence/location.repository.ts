import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Location } from '../../domain/location';
import {
  FilterLocationDto,
  SortLocationDto,
} from '../../dto/query-location.dto';

export abstract class LocationRepository {
  abstract create(data: Omit<Location, 'id' | 'created_at'>): Promise<Location>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterLocationDto | null;
    sortOptions?: SortLocationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Location[]>;

  abstract findById(id: Location['id']): Promise<NullableType<Location>>;

  abstract findByIds(ids: Location['id'][]): Promise<Location[]>;

  abstract findByDailyRideId(
    dailyRideId: Location['daily_ride']['id'],
  ): Promise<Location[]>;

  abstract findByDriverId(
    driverId: Location['driver']['id'],
  ): Promise<Location[]>;

  abstract findByTimeRange(startTime: Date, endTime: Date): Promise<Location[]>;

  abstract findLatestByDriverId(
    driverId: Location['driver']['id'],
  ): Promise<NullableType<Location>>;

  abstract update(
    id: Location['id'],
    payload: DeepPartial<Location>,
  ): Promise<Location | null>;

  abstract remove(id: Location['id']): Promise<void>;
}
