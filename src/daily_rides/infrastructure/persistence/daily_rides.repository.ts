import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { DailyRideStatus } from '../../../utils/types/enums';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { DailyRide } from '../../domain/daily_rides';
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from '../../dto/query-dailyrides.dto';

/**
 * Abstract Repository for DailyRide.
 *
 * Defines the contract (methods) for DailyRide persistence.
 * Actual database operations are implemented in the concrete repository.
 */
export abstract class DailyRideRepository {
  /**
   * Create a new DailyRide.
   * @param data - Partial DailyRide object without id, created_at, updated_at
   * @returns Promise resolving to the created DailyRide with relations
   */
  abstract create(
    data: Omit<DailyRide, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<DailyRide>;

  /**
   * Retrieve multiple DailyRides with optional filtering, sorting, and pagination.
   * @param filterOptions - Optional filtering criteria
   * @param sortOptions - Optional sorting criteria
   * @param paginationOptions - Pagination settings (page, limit)
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterDailyRideDto | null;
    sortOptions?: SortDailyRideDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<DailyRide[]>;

  /**
   * Find a DailyRide by its unique ID.
   * @param id - DailyRide ID
   * @returns Promise resolving to the DailyRide or null if not found
   */
  abstract findById(id: DailyRide['id']): Promise<NullableType<DailyRide>>;

  /**
   * Find multiple DailyRides by an array of IDs.
   * @param ids - Array of DailyRide IDs
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findByIds(ids: DailyRide['id'][]): Promise<DailyRide[]>;

  /**
   * Find all DailyRides for a specific Ride ID.
   * @param rideId - Ride ID
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findByRideId(rideId: number): Promise<DailyRide[]>;

  /**
   * Find DailyRides within a specific date range.
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyRide[]>;

  /**
   * Retrieve all of today's rides for a specific driver.
   * @param driverId - Driver ID
   * @param date - Today's date (as string)
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findTodayRidesForDriver(
    driverId: number,
    date: string,
  ): Promise<DailyRide[]>;

  /**
   * Update a DailyRide by its ID.
   * @param id - DailyRide ID
   * @param payload - Partial DailyRide data to update
   * @returns Promise resolving to the updated DailyRide or null if not found
   */
  abstract update(
    id: DailyRide['id'],
    payload: DeepPartial<DailyRide>,
  ): Promise<DailyRide | null>;

  /**
   * Remove a DailyRide by its ID.
   * @param id - DailyRide ID
   * @returns Promise resolving when the DailyRide is deleted
   */
  abstract remove(id: DailyRide['id']): Promise<void>;

  /**
   * Find all DailyRides for a driver with optional status filtering.
   * @param driverId - Driver ID
   * @param status - Optional DailyRideStatus to filter by
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findByDriverIdWithStatus(
    driverId: number,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  /**
   * Find all DailyRides for a parent with optional status filtering.
   * @param parentId - Parent ID
   * @param status - Optional DailyRideStatus to filter by
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findByParentIdWithStatus(
    parentId: number,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  /**
   * Update all of today's rides for a driver with a specific status.
   * @param driverId - Driver ID
   * @param date - Today's date
   * @param status - New status to set
   * @param driverStartTime - Optional start time to set for driver
   * @returns Promise resolving to the number of rides updated
   */
  abstract updateAllTodayRidesForDriver(
    driverId: number,
    date: string,
    status: DailyRideStatus,
    driverStartTime?: Date,
  ): Promise<number>;

  /**
   * Find upcoming rides for a driver within a date range, optionally filtered by status.
   * @param driverId - Driver ID
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @param status - Optional DailyRideStatus to filter by
   * @returns Promise resolving to an array of DailyRide objects
   */
  abstract findUpcomingRidesForDriver(
    driverId: number,
    startDate: Date,
    endDate: Date,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  /**
   * Find upcoming rides for a parent within a date range, optionally filtered by status.
   * @param parentId - Parent ID
   * @param startDate - Start date of range
   * @param endDate - End date of range
   * @param status - Optional DailyRideStatus to filter by
   * @returns Promise resolving to an array of DailyRide objects
   */
  /**
   * Find upcoming rides for a parent within a date range, optionally filtered by status.
   */
  abstract findUpcomingRidesForParent(
    parentId: number,
    startDate: Date,
    endDate: Date,
    status?: DailyRideStatus,
  ): Promise<DailyRide[]>;

  /**
   * Save multiple DailyRides at once.
   * @param rides - Array of DailyRide domain objects
   * @returns Promise resolving to the saved DailyRide objects
   */
  abstract saveAll(rides: DailyRide[]): Promise<DailyRide[]>;
}
