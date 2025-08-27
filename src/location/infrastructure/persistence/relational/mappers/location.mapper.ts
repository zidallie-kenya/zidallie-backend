import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { LocationEntity } from '../entities/location.entity';
import { Location } from '../../../../domain/location';
import { mapRelation } from '../../../../../utils/relation.mapper';

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

  static toPersistence(domainEntity: Location): Partial<LocationEntity> {
    const persistence: Partial<LocationEntity> = {};

    //simple fields
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.latitude !== undefined)
      persistence.latitude = domainEntity.latitude;
    if (domainEntity.longitude !== undefined)
      persistence.longitude = domainEntity.longitude;
    if (domainEntity.timestamp !== undefined)
      persistence.timestamp = domainEntity.timestamp;

    // relations

    //daily_ride
    persistence.daily_ride =
      (mapRelation(
        domainEntity.daily_ride,
        DailyRideMapper,
      ) as DailyRideEntity) || undefined;

    //driver
    persistence.driver =
      (mapRelation(domainEntity.driver, UserMapper) as UserEntity) || undefined;

    return persistence;
  }
}
