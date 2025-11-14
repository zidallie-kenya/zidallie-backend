import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolDisbursementEntity } from '../entities/school_disbursement.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentPaymentEntity } from '../entities/student_payment.entity';
import { SchoolDisbursementMapper } from '../mappers/school_disbursement.mapper';
import {
  SchoolDisbursement,
  DisbursementType,
  DisbursementStatus,
} from '../../../../domain/school_disbursement';

@Injectable()
export class SchoolDisbursementRepository {
  constructor(
    @InjectRepository(SchoolDisbursementEntity)
    private readonly repository: Repository<SchoolDisbursementEntity>,
  ) {}

  async create(data: {
    student: StudentEntity;
    termId?: number | null;
    payment: StudentPaymentEntity;
    bank_paybill: string | null;
    account_number: string | null;
    amount_disbursed: number;
    disbursement_type: DisbursementType;
    transaction_id: string;
    status: DisbursementStatus;
  }): Promise<SchoolDisbursement> {
    const disbursement = this.repository.create({
      student: data.student,
      term: data.termId ? ({ id: data.termId } as any) : null,
      payment: data.payment,
      bank_paybill: data.bank_paybill,
      account_number: data.account_number,
      amount_disbursed: data.amount_disbursed,
      disbursement_type: data.disbursement_type,
      transaction_id: data.transaction_id,
      status: data.status,
    });

    const saved = await this.repository.save(disbursement);

    // Reload with relations to ensure mapper has complete data
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['student', 'term', 'payment'],
    });

    if (!reloaded) {
      throw new Error('Failed to reload school disbursement after creation');
    }

    return SchoolDisbursementMapper.toDomain(reloaded);
  }

  async updateStatus(
    originatorConversationId: string,
    status: DisbursementStatus,
    transactionId?: string,
  ): Promise<SchoolDisbursement | null> {
    const entity = await this.repository.findOne({
      where: { transaction_id: originatorConversationId },
      relations: ['student', 'term', 'payment'],
    });

    if (!entity) {
      return null;
    }

    entity.status = status;
    if (transactionId) {
      entity.transaction_id = transactionId;
    }

    const saved = await this.repository.save(entity);

    // Reload with relations
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['student', 'term', 'payment'],
    });

    if (!reloaded) {
      throw new Error('Failed to reload school disbursement after update');
    }

    return SchoolDisbursementMapper.toDomain(reloaded);
  }

  async findByStudent(studentId: number): Promise<SchoolDisbursement[]> {
    const entities = await this.repository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'term', 'payment'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => SchoolDisbursementMapper.toDomain(entity));
  }

  async findByTerm(termId: number): Promise<SchoolDisbursement[]> {
    const entities = await this.repository.find({
      where: { term: { id: termId } },
      relations: ['student', 'term', 'payment'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => SchoolDisbursementMapper.toDomain(entity));
  }

  async findPendingDisbursements(): Promise<SchoolDisbursement[]> {
    const entities = await this.repository.find({
      where: { status: 'pending' },
      relations: ['student', 'term', 'payment'],
      order: { created_at: 'ASC' },
    });
    return entities.map((entity) => SchoolDisbursementMapper.toDomain(entity));
  }

  async findFailedDisbursements(): Promise<SchoolDisbursement[]> {
    const entities = await this.repository.find({
      where: { status: 'failed' },
      relations: ['student', 'term', 'payment'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => SchoolDisbursementMapper.toDomain(entity));
  }

  async getTotalDisbursedByTerm(termId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('disbursement')
      .select('SUM(disbursement.amount_disbursed)', 'total')
      .where('disbursement.term.id = :termId', { termId })
      .andWhere('disbursement.status = :status', { status: 'completed' })
      .getRawOne();

    return result?.total ? parseFloat(result.total) : 0;
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<SchoolDisbursement | null> {
    const entity = await this.repository.findOne({
      where: { transaction_id: transactionId },
      relations: ['student', 'term', 'payment'],
    });
    return entity ? SchoolDisbursementMapper.toDomain(entity) : null;
  }
}
