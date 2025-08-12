import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
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

  static toPersistence(domainEntity: Onboarding): OnboardingFormEntity {
    let school: SchoolEntity | undefined = undefined;
    if (domainEntity.school) {
      school = SchoolMapper.toPersistence(domainEntity.school);
    }

    const persistenceEntity = new OnboardingFormEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.parent_name = domainEntity.parent_name;
    persistenceEntity.parent_email = domainEntity.parent_email;
    persistenceEntity.parent_phone = domainEntity.parent_phone;
    persistenceEntity.address = domainEntity.address;
    persistenceEntity.student_name = domainEntity.student_name;
    persistenceEntity.student_gender = domainEntity.student_gender;
    if (school) {
      persistenceEntity.school = school;
    }
    persistenceEntity.ride_type = domainEntity.ride_type;
    persistenceEntity.pickup = domainEntity.pickup;
    persistenceEntity.dropoff = domainEntity.dropoff;
    persistenceEntity.start_date = domainEntity.start_date;
    persistenceEntity.mid_term = domainEntity.mid_term;
    persistenceEntity.end_date = domainEntity.end_date;
    persistenceEntity.created_at = domainEntity.created_at;
    return persistenceEntity;
  }
}
