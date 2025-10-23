import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In, ILike, IsNull } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';

import { Student } from '../../../../domain/student';
import { StudentMapper } from '../mappers/student.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterStudentDto,
  SortStudentDto,
} from '../../../../dto/query-stuudent.dto';
import { StudentRepository } from '../../student.repository';

@Injectable()
export class StudentsRelationalRepository implements StudentRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentsRepository: Repository<StudentEntity>,
  ) {}

  async create(data: Student): Promise<Student> {
    const persistenceModel = StudentMapper.toPersistence(data);
    const newEntity = await this.studentsRepository.save(
      this.studentsRepository.create(persistenceModel),
    );
    return StudentMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Student[]> {
    const where: FindOptionsWhere<StudentEntity> = {};

    if (filterOptions?.schoolId) {
      where.school = { id: Number(filterOptions.schoolId) };
    }

    if (filterOptions?.parentId) {
      where.parent = { id: Number(filterOptions.parentId) };
    }

    if (filterOptions?.name) {
      where.name = ILike(`%${filterOptions.name}%`);
    }

    if (filterOptions?.gender) {
      where.gender = filterOptions.gender;
    }

    if (filterOptions?.address) {
      where.address = ILike(`%${filterOptions.address}%`);
    }

    const entities = await this.studentsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
      relations: ['school', 'parent', 'rides'],
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findById(id: Student['id']): Promise<NullableType<Student>> {
    const entity = await this.studentsRepository.findOne({
      where: { id: Number(id) },
      relations: ['school', 'parent', 'rides'],
    });

    return entity ? StudentMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Student['id'][]): Promise<Student[]> {
    const entities = await this.studentsRepository.find({
      where: { id: In(ids) },
      relations: ['school', 'parent', 'rides'],
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findByParentId(parentId: number): Promise<Student[]> {
    const entities = await this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('school.subscription_plans', 'subscription_plans')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('student.rides', 'rides')
      .leftJoinAndSelect('student.subscriptions', 'subscriptions')
      .leftJoinAndSelect('subscriptions.plan', 'plan')
      .where('parent.id = :parentId', { parentId })
      .orderBy('student.name', 'ASC')
      .getMany();

    console.log('Found students for parent ID:', parentId, entities);
    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findBySchoolId(schoolId: number): Promise<Student[]> {
    const entities = await this.studentsRepository.find({
      where: { school: { id: schoolId } },
      relations: ['school', 'parent', 'rides'],
      order: { name: 'ASC' },
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async searchByName(searchTerm: string): Promise<Student[]> {
    const entities = await this.studentsRepository.find({
      where: { name: ILike(`%${searchTerm}%`) },
      relations: ['school', 'parent', 'rides'],
      order: { name: 'ASC' },
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findByGender(gender: string): Promise<Student[]> {
    const entities = await this.studentsRepository.find({
      where: { gender: gender as any },
      relations: ['school', 'parent', 'rides'],
      order: { name: 'ASC' },
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findStudentsWithActiveRides(): Promise<Student[]> {
    const entities = await this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('student.rides', 'rides')
      .where('rides.status = :status', { status: 'Active' })
      .orderBy('student.name', 'ASC')
      .getMany();

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async findStudentsWithoutParent(): Promise<Student[]> {
    const entities = await this.studentsRepository.find({
      where: { parent: IsNull() },
      relations: ['school', 'parent', 'rides'],
      order: { name: 'ASC' },
    });

    return entities.map((student) => StudentMapper.toDomain(student));
  }

  async update(id: Student['id'], payload: Partial<Student>): Promise<Student> {
    const entity = await this.studentsRepository.findOne({
      where: { id: Number(id) },
      relations: ['school', 'parent', 'rides'],
    });

    if (!entity) {
      throw new Error('Student not found');
    }

    const updatedEntity = await this.studentsRepository.save(
      this.studentsRepository.create(
        StudentMapper.toPersistence({
          ...StudentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return StudentMapper.toDomain(updatedEntity);
  }

  async remove(id: Student['id']): Promise<void> {
    await this.studentsRepository.delete(id);
  }
}
