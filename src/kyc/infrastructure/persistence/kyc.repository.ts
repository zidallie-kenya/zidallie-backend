import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { KYC } from '../../domain/kyc';
import { FilterKYCDto } from '../../dto/query-kyc.dto';
import { SortKYCDto } from '../../dto/sort-kyc.dto';

export abstract class KYCRepository {
  abstract create(
    data: Omit<KYC, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<KYC>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterKYCDto | null;
    sortOptions?: SortKYCDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<KYC[]>;

  abstract findById(id: KYC['id']): Promise<NullableType<KYC>>;

  abstract findByUserId(userId: KYC['user']): Promise<NullableType<KYC>>;

  abstract update(
    id: KYC['id'],
    payload: DeepPartial<KYC>,
  ): Promise<KYC | null>;

  abstract remove(id: KYC['id']): Promise<void>;
}
