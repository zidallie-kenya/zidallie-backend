import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { StudentPaymentEntity } from '../entities/student_payment.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentPaymentMapper } from '../mappers/student_payment.mapper';
import {
  StudentPayment,
  PaymentType,
} from '../../../../domain/student_payment';

@Injectable()
export class StudentPaymentRepository {
  constructor(
    @InjectRepository(StudentPaymentEntity)
    private readonly repository: Repository<StudentPaymentEntity>,
  ) {}

  async create(
    manager: EntityManager,
    data: {
      student: StudentEntity;
      termId?: number | null;
      transaction_id: string;
      phone_number: string;
      amount_paid: number;
      payment_type: PaymentType;
    },
  ): Promise<StudentPayment> {
    const repo = manager.getRepository(StudentPaymentEntity);

    const payment = repo.create({
      student: data.student,
      term: data.termId ? ({ id: data.termId } as any) : null,
      transaction_id: data.transaction_id,
      phone_number: data.phone_number,
      amount_paid: data.amount_paid,
      payment_type: data.payment_type,
    });

    const saved = await repo.save(payment);

    // Reload with relations to ensure mapper has complete data
    const reloaded = await repo.findOne({
      where: { id: saved.id },
      relations: ['student', 'term'],
    });

    if (!reloaded) {
      throw new Error('Failed to reload student payment after creation');
    }

    return StudentPaymentMapper.toDomain(reloaded);
  }

  async findByStudent(studentId: number): Promise<StudentPayment[]> {
    const entities = await this.repository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'term'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => StudentPaymentMapper.toDomain(entity));
  }

  async findByTerm(termId: number): Promise<StudentPayment[]> {
    const entities = await this.repository.find({
      where: { term: { id: termId } },
      relations: ['student', 'term'],
      order: { created_at: 'DESC' },
    });
    return entities.map((entity) => StudentPaymentMapper.toDomain(entity));
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<StudentPayment | null> {
    const entity = await this.repository.findOne({
      where: { transaction_id: transactionId },
      relations: ['student', 'term'],
    });
    return entity ? StudentPaymentMapper.toDomain(entity) : null;
  }

  async getTotalPaidByStudent(
    studentId: number,
    termId?: number,
  ): Promise<number> {
    const query = this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount_paid)', 'total')
      .where('payment.student.id = :studentId', { studentId });

    if (termId) {
      query.andWhere('payment.term.id = :termId', { termId });
    }

    const result = await query.getRawOne();
    return result?.total ? parseFloat(result.total) : 0;
  }

  async getPaymentHistory(
    studentId: number,
    limit: number = 10,
  ): Promise<StudentPayment[]> {
    const entities = await this.repository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'term'],
      order: { created_at: 'DESC' },
      take: limit,
    });
    return entities.map((entity) => StudentPaymentMapper.toDomain(entity));
  }
}
