import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Onboarding } from '../../domain/onboarding';
import {
  FilterOnboardingDto,
  SortOnboardingDto,
} from '../../dto/query-onboarding.dto';

export abstract class OnboardingRepository {
  abstract create(
    data: Omit<Onboarding, 'id' | 'created_at'>,
  ): Promise<Onboarding>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterOnboardingDto | null;
    sortOptions?: SortOnboardingDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Onboarding[]>;

  abstract findById(id: Onboarding['id']): Promise<NullableType<Onboarding>>;
  abstract findByIds(ids: Onboarding['id'][]): Promise<Onboarding[]>;
  abstract findByParentEmail(email: string): Promise<Onboarding[]>;
  abstract findByParentPhone(phone: string): Promise<Onboarding[]>;
  abstract findBySchoolId(schoolId: number): Promise<Onboarding[]>;
  abstract findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Onboarding[]>;

  abstract update(
    id: Onboarding['id'],
    payload: DeepPartial<Onboarding>,
  ): Promise<Onboarding | null>;

  abstract remove(id: Onboarding['id']): Promise<void>;
}
