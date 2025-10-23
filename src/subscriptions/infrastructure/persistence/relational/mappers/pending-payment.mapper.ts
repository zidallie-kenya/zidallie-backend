import { PendingPayment } from "../../../../domain/pending-payment";
import { PendingPaymentEntity } from "../entities/pending_payment.entity";

export class PendingPaymentMapper {
    static toDomain(entity: PendingPaymentEntity): PendingPayment {
        return new PendingPayment({
            id: entity.id,
            studentId: entity.studentId,
            subscriptionPlanId: entity.subscriptionPlanId,
            amount: entity.amount,
            checkoutId: entity.checkoutId,
            createdAt: entity.created_at,
            updatedAt: entity.updated_at,
        });
    }

    static toPersistence(domain: PendingPayment): PendingPaymentEntity {
        const entity = new PendingPaymentEntity();
        entity.studentId = domain.studentId;
        entity.subscriptionPlanId = domain.subscriptionPlanId;
        entity.amount = domain.amount;
        entity.checkoutId = domain.checkoutId;
        entity.created_at = domain.createdAt ?? new Date();
        entity.updated_at = domain.updatedAt ?? new Date();
        return entity;
    }
}
