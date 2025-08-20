import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { DailyRideStatus } from '../../../utils/types/enums';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { DailyRide } from '../../domain/daily_rides';
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from '../../dto/query-dailyrides.dto';

export abstract class DailyRideRepository {
  abstract create(
    data: Omit<DailyRide, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DailyRide>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterDailyRideDto | null;
    sortOptions?: SortDailyRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<DailyRide[]>;

  abstract findById(id: DailyRide['id']): Promise<NullableType<DailyRide>>;

  abstract findByIds(ids: DailyRide['id'][]): Promise<DailyRide[]>;

  abstract findByRideId(rideId: number): Promise<DailyRide[]>;

  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyRide[]>;

  abstract findTodayRidesForDriver(
    driverId: number,
    date: string,
  ): Promise<DailyRide[]>;

  abstract update(
    id: DailyRide['id'],
    payload: DeepPartial<DailyRide>,
  ): Promise<DailyRide | null>;

  abstract remove(id: DailyRide['id']): Promise<void>;

  abstract findByDriverIdWithStatus(
    driverId: number,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  abstract findByParentIdWithStatus(
    parentId: number,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  abstract updateAllTodayRidesForDriver(
    driverId: number,
    date: string,
    status: DailyRideStatus,
    driverStartTime?: Date,
  ): Promise<number>;
}
