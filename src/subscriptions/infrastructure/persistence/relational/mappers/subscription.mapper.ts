import { Subscription } from '../../../../domain/subscription';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionPlanEntity } from '../entities/subscription_plans.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { PaymentTermEntity } from '../entities/payment_term.entity';
import { SubscriptionPlanMapper } from './subscription-plan.mapper';

export class SubscriptionMapper {
  static toDomain(entity: SubscriptionEntity): Subscription {
    return new Subscription({
      id: entity.id,
      start_date: entity.start_date,
      expiry_date: entity.expiry_date,
      amount: entity.amount,
      status: entity.status,
      total_paid: entity.total_paid,
      balance: entity.balance,
      is_commission_paid: entity.is_commission_paid,
      days_access: entity.days_access,
      last_payment_date: entity.last_payment_date,
      created_at: entity.created_at,
      updated_at: entity.updated_at,

      plan: entity.plan ? SubscriptionPlanMapper.toDomain(entity.plan) : null,
      student: entity.student
        ? ({
            id: entity.student.id,
            name: (entity.student as any)?.name,
          } as any)
        : null,
      term: entity.term
        ? { id: entity.term.id, name: (entity.term as any)?.name }
        : null,
    });
  }

  static toPersistence(domain: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();
    entity.id = domain.id;
    entity.start_date = domain.start_date;
    entity.expiry_date = domain.expiry_date;
    entity.amount = domain.amount;
    entity.status = domain.status;
    entity.total_paid = domain.total_paid ?? 0;
    entity.balance = domain.balance ?? 0;
    entity.is_commission_paid = domain.is_commission_paid ?? false;
    entity.days_access = domain.days_access ?? null;
    entity.last_payment_date = domain.last_payment_date ?? null;
    entity.created_at = domain.created_at ?? new Date();
    entity.updated_at = domain.updated_at ?? new Date();

    if (domain.plan && domain.plan.id) {
      entity.plan = { id: domain.plan.id } as SubscriptionPlanEntity;
    }
    if (domain.student && domain.student.id) {
      entity.student = { id: domain.student.id } as StudentEntity;
    }
    if (domain.term && domain.term.id) {
      entity.term = { id: domain.term.id } as PaymentTermEntity;
    }

    return entity;
  }
}
