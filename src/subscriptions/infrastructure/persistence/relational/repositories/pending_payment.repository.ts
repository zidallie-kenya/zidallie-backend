// src/subscriptions/infrastructure/persistence/relational/repositories/pending_payment.repository.ts
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PendingPaymentEntity } from '../entities/pending_payment.entity';

@Injectable()
export class PendingPaymentRepository extends Repository<PendingPaymentEntity> {
  constructor(private readonly dataSource: DataSource) {
    // 👇 Pass entity + entityManager to the base Repository constructor
    super(PendingPaymentEntity, dataSource.createEntityManager());
  }

  async createPendingPayment(
    studentId: number,
    amount: number,
    checkoutId: string,
    subscriptionPlanId: number,
  ) {
    const pendingPayment = this.create({
      studentId,
      amount,
      checkoutId,
      subscriptionPlanId,
    });
    return await this.save(pendingPayment);
  }

  async findByCheckoutId(checkoutId: string) {
    return await this.findOne({ where: { checkoutId } });
  }

  async removePendingPayment(entity: PendingPaymentEntity) {
    return await this.remove(entity);
  }
}
