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

  static toPersistence(domainEntity: School): SchoolEntity {
    let students: StudentEntity[] | undefined = undefined;
    if (domainEntity.students) {
      students = domainEntity.students.map((student) =>
        StudentMapper.toPersistence(student),
      );
    }

    let rides: RideEntity[] | undefined = undefined;
    if (domainEntity.rides) {
      rides = domainEntity.rides.map((ride) => RideMapper.toPersistence(ride));
    }

    let onboardings: OnboardingFormEntity[] | undefined = undefined;
    if (domainEntity.onboardings) {
      onboardings = domainEntity.onboardings.map((onboarding) =>
        OnboardingMapper.toPersistence(onboarding),
      );
    }

    const persistenceEntity = new SchoolEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.location = domainEntity.location;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.url = domainEntity.url;
    persistenceEntity.meta = domainEntity.meta;
    persistenceEntity.students = students ?? [];
    persistenceEntity.rides = rides ?? [];
    persistenceEntity.onboardings = onboardings ?? [];
    persistenceEntity.created_at = domainEntity.created_at;
    return persistenceEntity;
  }
}
