import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { Onboarding } from '../../../../domain/onboarding';
import { OnboardingFormEntity } from '../entities/onboarding.entity';

export class OnboardingMapper {
  static toDomain(raw: OnboardingFormEntity): Onboarding {
    const domainEntity = new Onboarding();
    domainEntity.id = raw.id;
    domainEntity.parent_name = raw.parent_name;
    domainEntity.parent_email = raw.parent_email;
    domainEntity.parent_phone = raw.parent_phone;
    domainEntity.address = raw.address;
    domainEntity.student_name = raw.student_name;
    domainEntity.student_gender = raw.student_gender;
    domainEntity.school = SchoolMapper.toDomain(raw.school);
    domainEntity.ride_type = raw.ride_type;
    domainEntity.pickup = raw.pickup;
    domainEntity.dropoff = raw.dropoff;
    domainEntity.start_date = raw.start_date;
    domainEntity.mid_term = raw.mid_term;
    domainEntity.end_date = raw.end_date;
    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: Partial<Onboarding>,
  ): Partial<OnboardingFormEntity> {
    const persistence: Partial<OnboardingFormEntity> = {};

    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.parent_name !== undefined)
      persistence.parent_name = domainEntity.parent_name;
    if (domainEntity.parent_email !== undefined)
      persistence.parent_email = domainEntity.parent_email;
    if (domainEntity.parent_phone !== undefined)
      persistence.parent_phone = domainEntity.parent_phone;
    if (domainEntity.address !== undefined)
      persistence.address = domainEntity.address;
    if (domainEntity.student_name !== undefined)
      persistence.student_name = domainEntity.student_name;
    if (domainEntity.student_gender !== undefined)
      persistence.student_gender = domainEntity.student_gender;
    if (domainEntity.ride_type !== undefined)
      persistence.ride_type = domainEntity.ride_type;
    if (domainEntity.pickup !== undefined)
      persistence.pickup = domainEntity.pickup;
    if (domainEntity.dropoff !== undefined)
      persistence.dropoff = domainEntity.dropoff;
    if (domainEntity.start_date !== undefined)
      persistence.start_date = domainEntity.start_date;
    if (domainEntity.mid_term !== undefined)
      persistence.mid_term = domainEntity.mid_term;
    if (domainEntity.end_date !== undefined)
      persistence.mid_term = domainEntity.end_date;

    //relations
    persistence.school = mapRelation(
      domainEntity.school,
      SchoolMapper,
    ) as SchoolEntity;
    return persistence;
  }
}
