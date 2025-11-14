import { OnboardingFormEntity } from '../../../../../onboarding/infrastructure/persistence/relational/entities/onboarding.entity';
import { OnboardingMapper } from '../../../../../onboarding/infrastructure/persistence/relational/mappers/onboarding.mapper';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { SubscriptionPlanEntity } from '../../../../../subscriptions/infrastructure/persistence/relational/entities/subscription_plans.entity';
import { SubscriptionPlanMapper } from '../../../../../subscriptions/infrastructure/persistence/relational/mappers/subscription-plan.mapper';
import { School } from '../../../../domain/schools';
import { SchoolEntity } from '../entities/school.entity';

export class SchoolMapper {
  static toDomain(raw: SchoolEntity): School {
    const domainEntity = new School();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.location = raw.location;
    domainEntity.comments = raw.comments;
    domainEntity.url = raw.url;
    domainEntity.meta = raw.meta;
    domainEntity.disbursement_phone_number = raw.disbursement_phone_number;
    domainEntity.bank_paybill_number = raw.bank_paybill_number;
    domainEntity.bank_account_number = raw.bank_account_number;
    domainEntity.smart_card_url = raw.smart_card_url;
    domainEntity.terra_email = raw.terra_email;
    domainEntity.terra_password = raw.terra_password;
    domainEntity.terra_tag_id = raw.terra_tag_id;
    domainEntity.terra_zone_tag = raw.terra_zone_tag;
    domainEntity.terra_parents_tag = raw.terra_parents_tag;
    domainEntity.terra_student_tag = raw.terra_student_tag;
    domainEntity.terra_school_tag = raw.terra_school_tag;
    domainEntity.has_commission = raw.has_commission;
    domainEntity.commission_amount = raw.commission_amount;
    domainEntity.paybill = raw.paybill;
    domainEntity.service_type = raw.service_type;

    if (raw.students) {
      domainEntity.students = raw.students.map((student) =>
        StudentMapper.toDomain(student),
      );
    } else {
      domainEntity.students = [];
    }

    if (raw.rides) {
      domainEntity.rides = raw.rides.map((ride) => RideMapper.toDomain(ride));
    } else {
      domainEntity.rides = [];
    }

    if (raw.onboardings) {
      domainEntity.onboardings = raw.onboardings.map((onboarding) =>
        OnboardingMapper.toDomain(onboarding),
      );
    } else {
      domainEntity.onboardings = [];
    }

    if (raw.subscription_plans) {
      domainEntity.subscription_plans = raw.subscription_plans.map((plan) =>
        SubscriptionPlanMapper.toDomain(plan),
      );
    } else {
      domainEntity.subscription_plans = [];
    }

    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<School>): Partial<SchoolEntity> {
    const persistence: Partial<SchoolEntity> = {};

    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.name !== undefined) persistence.name = domainEntity.name;
    if (domainEntity.disbursement_phone_number !== undefined)
      persistence.disbursement_phone_number =
        domainEntity.disbursement_phone_number;
    if (domainEntity.bank_paybill_number !== undefined)
      persistence.bank_paybill_number = domainEntity.bank_paybill_number;
    if (domainEntity.bank_account_number !== undefined)
      persistence.bank_account_number = domainEntity.bank_account_number;
    if (domainEntity.location !== undefined)
      persistence.location = domainEntity.location;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.url !== undefined) persistence.url = domainEntity.url;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
    if (domainEntity.smart_card_url !== undefined)
      persistence.smart_card_url = domainEntity.smart_card_url;
    if (domainEntity.terra_email !== undefined)
      persistence.terra_email = domainEntity.terra_email;
    if (domainEntity.terra_password !== undefined)
      persistence.terra_password = domainEntity.terra_password;
    if (domainEntity.terra_tag_id !== undefined)
      persistence.terra_tag_id = domainEntity.terra_tag_id;
    if (domainEntity.terra_zone_tag !== undefined)
      persistence.terra_zone_tag = domainEntity.terra_zone_tag;
    if (domainEntity.terra_parents_tag !== undefined)
      persistence.terra_parents_tag = domainEntity.terra_parents_tag;
    if (domainEntity.terra_student_tag !== undefined)
      persistence.terra_student_tag = domainEntity.terra_student_tag;
    if (domainEntity.terra_school_tag !== undefined)
      persistence.terra_school_tag = domainEntity.terra_school_tag;
    if (domainEntity.has_commission !== undefined)
      persistence.has_commission = domainEntity.has_commission;
    if (domainEntity.commission_amount !== undefined)
      persistence.commission_amount = domainEntity.commission_amount;
    if (domainEntity.paybill !== undefined)
      persistence.paybill = domainEntity.paybill;
    if (domainEntity.service_type !== undefined)
      persistence.service_type = domainEntity.service_type;

    if (domainEntity.students !== undefined) {
      persistence.students = domainEntity.students.map(
        (student) => StudentMapper.toPersistence(student) as StudentEntity,
      );
    }
    if (domainEntity.rides !== undefined) {
      persistence.rides = domainEntity.rides.map(
        (ride) => RideMapper.toPersistence(ride) as RideEntity,
      );
    }
    if (domainEntity.onboardings !== undefined) {
      persistence.onboardings = domainEntity.onboardings.map(
        (onboarding) =>
          OnboardingMapper.toPersistence(onboarding) as OnboardingFormEntity,
      );
    }
    if (domainEntity.subscription_plans !== undefined) {
      persistence.subscription_plans = domainEntity.subscription_plans.map(
        (plan) =>
          SubscriptionPlanMapper.toPersistence(plan) as SubscriptionPlanEntity,
      );
    }

    return persistence;
  }
}
