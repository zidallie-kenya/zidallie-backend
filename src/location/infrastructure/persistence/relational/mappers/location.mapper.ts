import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { LocationEntity } from '../entities/location.entity';
import { Location } from '../../../../domain/location';

export class LocationMapper {
  static toDomain(raw: LocationEntity): Location {
    const domainEntity = new Location();
    domainEntity.id = raw.id;
    domainEntity.daily_ride = DailyRideMapper.toDomain(raw.daily_ride);
    domainEntity.driver = UserMapper.toDomain(raw.driver);
    domainEntity.latitude = raw.latitude;
    domainEntity.longitude = raw.longitude;
    domainEntity.timestamp = raw.timestamp;
    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Location): LocationEntity {
    let daily_ride: DailyRideEntity | undefined = undefined;
    if (domainEntity.daily_ride) {
      daily_ride = DailyRideMapper.toPersistence(domainEntity.daily_ride);
    }

    let driver: UserEntity | undefined = undefined;
    if (domainEntity.driver) {
      driver = UserMapper.toPersistence(domainEntity.driver);
    }

    const persistenceEntity = new LocationEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    if (daily_ride) {
      persistenceEntity.daily_ride = daily_ride;
    }
    if (driver) {
      persistenceEntity.driver = driver;
    }
    persistenceEntity.latitude = domainEntity.latitude;
    persistenceEntity.longitude = domainEntity.longitude;
    persistenceEntity.timestamp = domainEntity.timestamp;
    persistenceEntity.created_at = domainEntity.created_at;
    return persistenceEntity;
  }
}
