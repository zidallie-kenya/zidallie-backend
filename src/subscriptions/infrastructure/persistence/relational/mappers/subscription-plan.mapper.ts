import { SubscriptionPlan } from '../../../../domain/subscription-plan';
import { SubscriptionPlanEntity } from '../entities/subscription_plans.entity';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';

export class SubscriptionPlanMapper {
  static toDomain(entity: SubscriptionPlanEntity): SubscriptionPlan {
    const plan = new SubscriptionPlan();
    plan.id = entity.id;
    plan.school_id = entity.school?.id;
    plan.name = entity.name;
    plan.description = entity.description ?? undefined;
    plan.price = entity.price;
    plan.duration_days = entity.duration_days;
    plan.is_active = entity.is_active;
    plan.created_at = entity.created_at;
    plan.updated_at = entity.updated_at;
    return plan;
  }

  static toPersistence(
    domain: Partial<SubscriptionPlan>,
  ): Partial<SubscriptionPlanEntity> {
    const entity: Partial<SubscriptionPlanEntity> = {};

    if (domain.id !== undefined) entity.id = domain.id;
    if (domain.name !== undefined) entity.name = domain.name;
    if (domain.description !== undefined)
      entity.description = domain.description ?? undefined;
    if (domain.price !== undefined) entity.price = domain.price;
    if (domain.duration_days !== undefined)
      entity.duration_days = domain.duration_days;
    if (domain.is_active !== undefined) entity.is_active = domain.is_active;
    if (domain.created_at !== undefined) entity.created_at = domain.created_at;
    if (domain.updated_at !== undefined) entity.updated_at = domain.updated_at;

    if (domain.school_id !== undefined && domain.school_id !== null) {
      entity.school = { id: domain.school_id } as SchoolEntity;
    }

    return entity;
  }
}
