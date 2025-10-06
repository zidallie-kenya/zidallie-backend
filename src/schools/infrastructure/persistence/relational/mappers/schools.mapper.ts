import { OnboardingFormEntity } from '../../../../../onboarding/infrastructure/persistence/relational/entities/onboarding.entity';
import { OnboardingMapper } from '../../../../../onboarding/infrastructure/persistence/relational/mappers/onboarding.mapper';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
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
    domainEntity.smart_card_url = raw.smart_card_url;
    domainEntity.terra_email = raw.terra_email;
    domainEntity.terra_password = raw.terra_password;

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

    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<School>): Partial<SchoolEntity> {
    const persistence: Partial<SchoolEntity> = {};

    //simple fields
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.name !== undefined) persistence.name = domainEntity.name;
    if (domainEntity.location !== undefined)
      persistence.location = domainEntity.location;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.url !== undefined) persistence.url = domainEntity.url;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
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
    if (domainEntity.smart_card_url !== undefined)
      persistence.smart_card_url = domainEntity.smart_card_url;

    if (domainEntity.terra_email !== undefined)
      persistence.terra_email = domainEntity.terra_email;

    if (domainEntity.terra_password !== undefined)
      persistence.terra_password = domainEntity.terra_password;
    return persistence;
  }
}
