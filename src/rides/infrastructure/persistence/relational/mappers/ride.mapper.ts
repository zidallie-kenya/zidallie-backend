import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { SchoolEntity } from '../../../../../schools/infrastructure/persistence/relational/entities/school.entity';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
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

  static toPersistence(domainEntity: Ride): RideEntity {
    let vehicle: VehicleEntity | undefined | null = undefined;
    if (domainEntity.vehicle && domainEntity.vehicle.id) {
      vehicle = VehicleMapper.toPersistence(domainEntity.vehicle);
    } else if (domainEntity.vehicle === null) {
      vehicle = null;
    }

    let driver: UserEntity | undefined | null = undefined;
    if (domainEntity.driver && domainEntity.driver.id) {
      driver = UserMapper.toPersistence(domainEntity.driver);
    } else if (domainEntity.driver === null) {
      driver = null;
    }

    let school: SchoolEntity | undefined | null = undefined;
    if (domainEntity.school && domainEntity.school.id) {
      school = SchoolMapper.toPersistence(domainEntity.school);
    } else if (domainEntity.school === null) {
      school = null;
    }

    let student: StudentEntity | undefined | null = undefined;
    if (domainEntity.student && domainEntity.student.id) {
      student = StudentMapper.toPersistence(domainEntity.student);
    } else if (domainEntity.student === null) {
      student = null;
    }

    let parent: UserEntity | undefined | null = undefined;
    if (domainEntity.parent && domainEntity.parent.id) {
      parent = UserMapper.toPersistence(domainEntity.parent);
    } else if (domainEntity.parent === null) {
      parent = null;
    }

    let daily_rides: DailyRideEntity[] | undefined = undefined;
    if (domainEntity.daily_rides && Array.isArray(domainEntity.daily_rides)) {
      daily_rides = domainEntity.daily_rides.map((dailyRide) =>
        DailyRideMapper.toPersistence(dailyRide),
      );
    }

    const persistenceEntity = new RideEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.vehicle = vehicle ?? null;
    persistenceEntity.driver = driver ?? null;
    persistenceEntity.school = school ?? null;
    persistenceEntity.student = student ?? null;
    persistenceEntity.parent = parent ?? null;
    persistenceEntity.schedule = domainEntity.schedule;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.admin_comments = domainEntity.admin_comments;
    persistenceEntity.meta = domainEntity.meta;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.daily_rides = daily_rides ?? [];
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_at = domainEntity.updated_at;
    return persistenceEntity;
  }
}
