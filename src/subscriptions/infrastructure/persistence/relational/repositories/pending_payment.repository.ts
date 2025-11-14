import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PendingPaymentEntity } from '../entities/pending_payment.entity';
import { PendingPayment } from '../../../../domain/pending-payment';
import { PendingPaymentMapper } from '../mappers/pending-payment.mapper';

@Injectable()
export class PendingPaymentRepository extends Repository<PendingPaymentEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(PendingPaymentEntity, dataSource.createEntityManager());
  }

  async createPendingPayment(data: {
    studentId: number;
    termId?: number | null;
    subscriptionPlanId: number;
    amount: number;
    checkoutId: string;
    phoneNumber?: string | null;
    paymentType?:
      | 'initial'
      | 'installment'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'termly'
      | null;
    paymentModel?: 'daily' | 'term' | 'zidallie' | null;
    schoolId?: number | null;
  }): Promise<PendingPayment> {
    const entity = this.create({
      studentId: data.studentId,
      termId: data.termId ?? null,
      subscriptionPlanId: data.subscriptionPlanId,
      amount: data.amount,
      checkoutId: data.checkoutId,
      phoneNumber: data.phoneNumber ?? null,
      paymentType: data.paymentType ?? null,
      paymentModel: data.paymentModel ?? null,
      schoolId: data.schoolId ?? null,
    });

    const saved = await this.save(entity);
    return PendingPaymentMapper.toDomain(saved);
  }

  async findByCheckoutId(checkoutId: string): Promise<PendingPayment | null> {
    const entity = await this.findOne({
      where: { checkoutId },
      relations: ['student', 'term'],
    });
    return entity ? PendingPaymentMapper.toDomain(entity) : null;
  }

  async removePendingPayment(entity: PendingPaymentEntity): Promise<void> {
    await this.remove(entity);
  }
}
