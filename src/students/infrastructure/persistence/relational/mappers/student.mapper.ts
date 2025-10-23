import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
import { SubscriptionEntity } from '../../../../../subscriptions/infrastructure/persistence/relational/entities/subscription.entity';
import { SubscriptionMapper } from '../../../../../subscriptions/infrastructure/persistence/relational/mappers/subscription.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
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

    if (raw.subscriptions) {
      domainEntity.subscriptions = raw.subscriptions.map((subscription) => SubscriptionMapper.toDomain(subscription));
    } else {
      domainEntity.subscriptions = [];
    }

    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<Student>): Partial<StudentEntity> {
    const persistence: Partial<StudentEntity> = {};
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.name !== undefined) persistence.name = domainEntity.name;
    if (domainEntity.profile_picture !== undefined)
      persistence.profile_picture = domainEntity.profile_picture;
    if (domainEntity.gender !== undefined)
      persistence.gender = domainEntity.gender;
    if (domainEntity.address !== undefined)
      persistence.address = domainEntity.address;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
    if (domainEntity.rides !== undefined)
      persistence.rides = domainEntity.rides.map(
        (ride) => RideMapper.toPersistence(ride) as RideEntity,
      );
    if (domainEntity.subscriptions !== undefined)
      persistence.subscriptions = domainEntity.subscriptions.map(
        (subscription) => SubscriptionMapper.toPersistence(subscription) as SubscriptionEntity,
      );
    //relations
    //school
    persistence.school =
      (mapRelation(domainEntity.school, SchoolMapper) as SchoolEntity) ||
      undefined;
    //parent
    persistence.parent =
      (mapRelation(domainEntity.parent, UserMapper) as UserEntity) || undefined;

    return persistence;
  }
}
