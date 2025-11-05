import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { Subscription } from '../../../../domain/subscription';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionPlanEntity } from '../entities/subscription_plans.entity';
import { SubscriptionPlanMapper } from './subscription-plan.mapper';

export class SubscriptionMapper {
  static toDomain(raw: SubscriptionEntity): Subscription {
    const domain = new Subscription();
    domain.id = raw.id;
    domain.start_date = raw.start_date;
    domain.expiry_date = raw.expiry_date;
    domain.amount = raw.amount;
    domain.status = raw.status;
    domain.created_at = raw.created_at;
    domain.updated_at = raw.updated_at;

    domain.plan = raw.plan ? SubscriptionPlanMapper.toDomain(raw.plan) : null;

    return domain;
  }

  static toPersistence(
    domain: Partial<Subscription>,
  ): Partial<SubscriptionEntity> {
    const entity: Partial<SubscriptionEntity> = {};

    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.start_date !== undefined) entity.start_date = domain.start_date;
    if (domain.expiry_date !== undefined)
      entity.expiry_date = domain.expiry_date;
    if (domain.amount !== undefined) entity.amount = domain.amount;
    if (domain.status !== undefined) entity.status = domain.status;

    if (domain.plan && domain.plan.id) {
      entity.plan = { id: domain.plan.id } as SubscriptionPlanEntity;
    }

    if (domain.student && domain.student.id) {
      entity.student = { id: domain.student.id } as StudentEntity;
    }

    return entity;
  }
}
