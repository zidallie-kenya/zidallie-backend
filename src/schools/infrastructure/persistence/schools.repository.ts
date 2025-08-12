import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { School } from '../../domain/schools';
import { FilterSchoolDto, SortSchoolDto } from '../../dto/query-school.dto';

export abstract class SchoolRepository {
  abstract create(data: Omit<School, 'id' | 'created_at'>): Promise<School>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSchoolDto | null;
    sortOptions?: SortSchoolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<School[]>;

  abstract findById(id: School['id']): Promise<NullableType<School>>;

  abstract findByIds(ids: School['id'][]): Promise<School[]>;

  abstract findByName(name: string): Promise<NullableType<School>>;

  abstract searchByName(searchTerm: string): Promise<School[]>;

  abstract findByLocation(location: string): Promise<School[]>;

  abstract findWithStudentCount(): Promise<any[]>;

  abstract update(
    id: School['id'],
    payload: Partial<School>,
  ): Promise<School | null>;

  abstract remove(id: School['id']): Promise<void>;
}
