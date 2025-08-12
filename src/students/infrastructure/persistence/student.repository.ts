import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Student } from '../../domain/student';
import { FilterStudentDto, SortStudentDto } from '../../dto/query-stuudent.dto';

export abstract class StudentRepository {
  abstract create(
    data: Omit<Student, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Student>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Student[]>;

  abstract findById(id: Student['id']): Promise<NullableType<Student>>;

  abstract findByIds(ids: Student['id'][]): Promise<Student[]>;

  abstract findByParentId(parentId: number): Promise<Student[]>;

  abstract findBySchoolId(schoolId: number): Promise<Student[]>;

  abstract searchByName(searchTerm: string): Promise<Student[]>;

  abstract findByGender(gender: string): Promise<Student[]>;

  abstract findStudentsWithActiveRides(): Promise<Student[]>;

  abstract findStudentsWithoutParent(): Promise<Student[]>;

  abstract update(
    id: Student['id'],
    payload: Partial<Student>,
  ): Promise<Student | null>;

  abstract remove(id: Student['id']): Promise<void>;
}
