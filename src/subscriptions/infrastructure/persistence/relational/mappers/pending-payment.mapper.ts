import { PendingPayment } from '../../../../domain/pending-payment';
import { PendingPaymentEntity } from '../entities/pending_payment.entity';

export class PendingPaymentMapper {
  static toDomain(entity: PendingPaymentEntity): PendingPayment {
    return new PendingPayment({
      id: entity.id,
      studentId: entity.studentId,
      termId: entity.termId,
      subscriptionPlanId: entity.subscriptionPlanId,
      amount: entity.amount,
      checkoutId: entity.checkoutId,
      phoneNumber: entity.phoneNumber,
      paymentType: entity.paymentType,
      paymentModel: entity.paymentModel,
      schoolId: entity.schoolId,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    });
  }

  static toPersistence(domain: PendingPayment): PendingPaymentEntity {
    const entity = new PendingPaymentEntity();
    if (domain.id) entity.id = domain.id;
    entity.studentId = domain.studentId;
    entity.termId = domain.termId ?? null;
    entity.subscriptionPlanId = domain.subscriptionPlanId;
    entity.amount = domain.amount;
    entity.checkoutId = domain.checkoutId;
    entity.phoneNumber = domain.phoneNumber ?? null;
    entity.paymentType = domain.paymentType ?? null;
    entity.paymentModel = domain.paymentModel ?? null;
    entity.schoolId = domain.schoolId ?? null;
    entity.created_at = domain.createdAt ?? new Date();
    entity.updated_at = domain.updatedAt ?? new Date();
    return entity;
  }
}
