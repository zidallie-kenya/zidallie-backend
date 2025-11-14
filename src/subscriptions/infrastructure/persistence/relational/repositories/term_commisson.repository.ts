import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TermCommissionEntity } from '../entities/term_commission.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { TermCommissionMapper } from '../mappers/term_commission.mapper';
import { TermCommission } from '../../../../domain/term_commission';

@Injectable()
export class TermCommissionRepository {
  constructor(
    @InjectRepository(TermCommissionEntity)
    private readonly repository: Repository<TermCommissionEntity>,
  ) {}

  async findByStudentAndTerm(
    studentId: number,
    termId: number,
  ): Promise<TermCommission | null> {
    const entity = await this.repository.findOne({
      where: {
        student: { id: studentId },
        term: { id: termId },
      },
      relations: ['student', 'term'],
    });
    return entity ? TermCommissionMapper.toDomain(entity) : null;
  }

  async getOrCreate(
    manager: EntityManager,
    data: {
      student: StudentEntity;
      termId: number;
      commissionAmount: number;
    },
  ): Promise<TermCommission> {
    const repo = manager.getRepository(TermCommissionEntity);

    let entity = await repo.findOne({
      where: {
        student: { id: data.student.id },
        term: { id: data.termId },
      },
      relations: ['student', 'term'],
    });

    if (!entity) {
      entity = repo.create({
        student: data.student,
        term: { id: data.termId } as any,
        commission_amount: data.commissionAmount,
        is_paid: false,
        paid_at: null,
      });
      entity = await repo.save(entity);

      // Reload with relations
      const reloaded = await repo.findOne({
        where: { id: entity.id },
        relations: ['student', 'term'],
      });

      if (!reloaded) {
        throw new Error('Failed to reload newly created TermCommissionEntity');
      }

      return TermCommissionMapper.toDomain(reloaded);
    }

    return TermCommissionMapper.toDomain(entity);
  }

  async save(
    manager: EntityManager,
    termCommission: TermCommission,
  ): Promise<TermCommission> {
    const repo = manager.getRepository(TermCommissionEntity);
    const entity = TermCommissionMapper.toPersistence(termCommission);
    const saved = await repo.save(entity);

    const reloaded = await repo.findOne({
      where: { id: saved.id },
      relations: ['student', 'term'],
    });

    if (!reloaded) {
      throw new Error(
        `Failed to reload TermCommissionEntity with id ${saved.id}`,
      );
    }

    return TermCommissionMapper.toDomain(reloaded);
  }

  async findByTerm(termId: number): Promise<TermCommission[]> {
    const entities = await this.repository.find({
      where: { term: { id: termId } },
      relations: ['student', 'term'],
    });
    return entities.map((entity) => TermCommissionMapper.toDomain(entity));
  }

  async findByStudent(studentId: number): Promise<TermCommission[]> {
    const entities = await this.repository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'term'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => TermCommissionMapper.toDomain(entity));
  }

  async markAsPaid(id: number): Promise<TermCommission | null> {
    await this.repository.update(id, {
      is_paid: true,
      paid_at: new Date(),
    });

    const entity = await this.repository.findOne({
      where: { id },
      relations: ['student', 'term'],
    });

    return entity ? TermCommissionMapper.toDomain(entity) : null;
  }
}
