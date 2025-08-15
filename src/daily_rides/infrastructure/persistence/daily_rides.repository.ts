import { DeepPartial } from '../../../utils/types/deep-partial.type';
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

  abstract findByDriverId(driverId: number): Promise<DailyRide[]>;

  abstract findByParentId(parentId: number): Promise<DailyRide[]>;

  abstract debugFindByParentId(parentId: number): Promise<DailyRide[]>;

  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyRide[]>;

  // Add new abstract methods for dashboard functionality
  abstract countTotalTripsForDriver(driverId: number): Promise<number>;

  abstract countUpcomingTripsForDriver(
    driverId: number,
    afterDate: string,
  ): Promise<number>;

  abstract findTodayRidesForDriver(
    driverId: number,
    date: string,
  ): Promise<DailyRide[]>;

  abstract update(
    id: DailyRide['id'],
    payload: DeepPartial<DailyRide>,
  ): Promise<DailyRide | null>;

  abstract remove(id: DailyRide['id']): Promise<void>;
}
// import { DeepPartial } from '../../../utils/types/deep-partial.type';
// import { NullableType } from '../../../utils/types/nullable.type';
// import { IPaginationOptions } from '../../../utils/types/pagination-options';
// import { DailyRide } from '../../domain/daily_rides';
// import {
//   FilterDailyRideDto,
//   SortDailyRideDto,
// } from '../../dto/query-dailyrides.dto';

// export abstract class DailyRideRepository {
//   abstract create(
//     data: Omit<DailyRide, 'id' | 'created_at' | 'updated_at'>,
//   ): Promise<DailyRide>;

//   abstract findManyWithPagination({
//     filterOptions,
//     sortOptions,
//     paginationOptions,
//   }: {
//     filterOptions?: FilterDailyRideDto | null;
//     sortOptions?: SortDailyRideDto[] | null;
//     paginationOptions: IPaginationOptions;
//   }): Promise<DailyRide[]>;

//   abstract findById(id: DailyRide['id']): Promise<NullableType<DailyRide>>;

//   abstract findByIds(ids: DailyRide['id'][]): Promise<DailyRide[]>;

//   abstract findByRideId(rideId: number): Promise<DailyRide[]>;

//   abstract findByDriverId(driverId: number): Promise<DailyRide[]>;

//   abstract findByDateRange(
//     startDate: Date,
//     endDate: Date,
//   ): Promise<DailyRide[]>;

//   abstract update(
//     id: DailyRide['id'],
//     payload: DeepPartial<DailyRide>,
//   ): Promise<DailyRide | null>;

//   abstract remove(id: DailyRide['id']): Promise<void>;
// }
