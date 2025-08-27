import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { VehicleMapper } from '../../../../../vehicles/infrastructure/persistence/relational/mappers/vehicles.mapper';
import { Ride } from '../../../../domain/rides';
import { RideEntity } from '../entities/ride.entity';

export class RideMapper {
  static toDomain(raw: RideEntity): Ride {
    const domainEntity = new Ride();
    domainEntity.id = raw.id;

    domainEntity.vehicle = raw.vehicle
      ? VehicleMapper.toDomain(raw.vehicle)
      : null;
    domainEntity.driver = raw.driver ? UserMapper.toDomain(raw.driver) : null;
    domainEntity.school = raw.school ? SchoolMapper.toDomain(raw.school) : null;
    domainEntity.student = raw.student
      ? StudentMapper.toDomain(raw.student)
      : null;
    domainEntity.parent = raw.parent ? UserMapper.toDomain(raw.parent) : null;

    domainEntity.schedule = raw.schedule;
    domainEntity.comments = raw.comments;
    domainEntity.admin_comments = raw.admin_comments;
    domainEntity.meta = raw.meta;
    domainEntity.status = raw.status;

    domainEntity.daily_rides = Array.isArray(raw.daily_rides)
      ? raw.daily_rides.map(DailyRideMapper.toDomain)
      : [];

    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;

    console.log(domainEntity);

    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<Ride>): Partial<RideEntity> {
    const persistence: Partial<RideEntity> = {};

    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.schedule !== undefined)
      persistence.schedule = domainEntity.schedule;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.admin_comments !== undefined)
      persistence.admin_comments = domainEntity.admin_comments;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
    if (domainEntity.status !== undefined)
      persistence.status = domainEntity.status;
    if (domainEntity.daily_rides !== undefined) {
      persistence.daily_rides = domainEntity.daily_rides.map(
        (dr) => DailyRideMapper.toPersistence(dr) as DailyRideEntity,
      );
    }

    // relations
    //vehicle
    persistence.vehicle =
      (mapRelation(domainEntity.vehicle, VehicleMapper) as VehicleEntity) ||
      undefined;
    //driver
    persistence.driver =
      (mapRelation(domainEntity.driver, UserMapper) as UserEntity) || undefined;
    //school
    persistence.school =
      (mapRelation(domainEntity.school, SchoolMapper) as SchoolEntity) ||
      undefined;
    //student
    persistence.student =
      (mapRelation(domainEntity.student, StudentMapper) as StudentEntity) ||
      undefined;
    //parent
    persistence.parent =
      (mapRelation(domainEntity.parent, UserMapper) as UserEntity) || undefined;
    return persistence;
  }
}
