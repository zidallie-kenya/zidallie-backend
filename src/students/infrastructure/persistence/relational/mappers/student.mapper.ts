import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Student } from '../../../../domain/student';
import { StudentEntity } from '../entities/student.entity';

export class StudentMapper {
  static toDomain(raw: StudentEntity): Student {
    const domainEntity = new Student();
    domainEntity.id = raw.id;

    if (raw.school) {
      domainEntity.school = SchoolMapper.toDomain(raw.school);
    } else {
      domainEntity.school = null;
    }

    if (raw.parent) {
      domainEntity.parent = UserMapper.toDomain(raw.parent);
    } else {
      domainEntity.parent = null;
    }

    domainEntity.name = raw.name;
    domainEntity.profile_picture = raw.profile_picture;
    domainEntity.gender = raw.gender;
    domainEntity.address = raw.address;
    domainEntity.comments = raw.comments;
    domainEntity.meta = raw.meta;

    if (raw.rides) {
      domainEntity.rides = raw.rides.map((ride) => RideMapper.toDomain(ride));
    } else {
      domainEntity.rides = [];
    }

    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Student): StudentEntity {
    let school: SchoolEntity | undefined | null = undefined;
    if (domainEntity.school) {
      school = SchoolMapper.toPersistence(domainEntity.school);
    } else if (domainEntity.school === null) {
      school = null;
    }

    let parent: UserEntity | undefined | null = undefined;
    if (domainEntity.parent) {
      parent = UserMapper.toPersistence(domainEntity.parent);
    } else if (domainEntity.parent === null) {
      parent = null;
    }

    let rides: RideEntity[] | undefined = undefined;
    if (domainEntity.rides) {
      rides = domainEntity.rides.map((ride) => RideMapper.toPersistence(ride));
    }

    const persistenceEntity = new StudentEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.school = school ?? null;
    persistenceEntity.parent = parent ?? null;
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.profile_picture = domainEntity.profile_picture;
    persistenceEntity.gender = domainEntity.gender;
    persistenceEntity.address = domainEntity.address;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.meta = domainEntity.meta;
    persistenceEntity.rides = rides ?? [];
    persistenceEntity.created_at = domainEntity.created_at;
    return persistenceEntity;
  }
}
