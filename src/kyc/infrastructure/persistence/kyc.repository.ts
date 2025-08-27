import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { KYC } from '../../domain/kyc';
import { FilterKYCDto } from '../../dto/query-kyc.dto';
import { SortKYCDto } from '../../dto/sort-kyc.dto';

/**
 * Abstract Repository for KYC.
 *
 * This defines the contract (methods that must be implemented)
 * but does not implement any persistence logic itself.
 *
 * The actual implementation (e.g. RelationalKYCRepository) will
 * extend this and use TypeORM's Repository methods like `.create()`
 * and `.save
 */

export abstract class KYCRepository {
  /**
   * Create a new KYC entry.
   * (Implementation will typically use repository.create + repository.save)
   */
  abstract create(
    data: Omit<KYC, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<KYC>;

  /**
   * Get multiple KYC entries with pagination, filtering, and sorting.
   */
  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterKYCDto | null;
    sortOptions?: SortKYCDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<KYC[]>;

  /**
   * Find a KYC entry by its primary ID.
   */
  abstract findById(id: number): Promise<NullableType<KYC>>;

  /**
   * Find a KYC entry by the associated user.
   */
  abstract findByUserId(userId: KYC['user']): Promise<NullableType<KYC>>;

  /**
   * Update a KYC entry.
   */
  abstract update(
    id: KYC['id'],
    payload: DeepPartial<KYC>,
  ): Promise<KYC | null>;

  /**
   * Delete a KYC entry by ID.
   */
  abstract remove(id: KYC['id']): Promise<void>;

  /**
   * Get all KYC entries without filters.
   */
  abstract findAll(): Promise<KYC[]>;

  /**
   * Find a KYC entry by the associated driver.
   */
  abstract findByDriverId(driverId: number): Promise<NullableType<KYC>>;
}
