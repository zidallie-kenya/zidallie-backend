import { LocationMapper } from '../../../../../location/infrastructure/persistence/relational/mappers/location.mapper';
import { LocationEntity } from '../../../../../location/infrastructure/persistence/relational/entities/location.entity';
import { DailyRideEntity } from '../entities/daily_ride.entity';
import { DailyRide } from '../../../../domain/daily_rides';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { VehicleMapper } from '../../../../../vehicles/infrastructure/persistence/relational/mappers/vehicles.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
// Import your custom Location domain class

export class DailyRideMapper {
  static toDomain(raw: DailyRideEntity): DailyRide {
    const domainEntity = new DailyRide();
    domainEntity.id = raw.id;
    domainEntity.ride = raw.ride ? RideMapper.toDomain(raw.ride) : null;
    domainEntity.vehicle = raw.vehicle
      ? VehicleMapper.toDomain(raw.vehicle)
      : null;

    if (raw.driver) {
      domainEntity.driver = UserMapper.toDomain(raw.driver);
    } else {
      domainEntity.driver = null;
    }

    domainEntity.kind = raw.kind;
    domainEntity.date = raw.date;
    domainEntity.start_time = raw.start_time;
    domainEntity.end_time = raw.end_time;
    domainEntity.comments = raw.comments;
    domainEntity.meta = raw.meta;
    domainEntity.status = raw.status;

    // Fix: Proper location mapping without overwriting
    if (raw.locations && raw.locations.length > 0) {
      domainEntity.locations = raw.locations.map((location) =>
        LocationMapper.toDomain(location),
      );
    } else {
      domainEntity.locations = [];
    }

    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: DailyRide): DailyRideEntity {
    let ride: RideEntity | undefined = undefined;
    if (domainEntity.ride) {
      ride = RideMapper.toPersistence(domainEntity.ride);
    }

    let vehicle: VehicleEntity | undefined = undefined;
    if (domainEntity.vehicle) {
      vehicle = VehicleMapper.toPersistence(domainEntity.vehicle);
    }

    let driver: UserEntity | undefined | null = undefined;
    if (domainEntity.driver) {
      driver = UserMapper.toPersistence(domainEntity.driver);
    } else if (domainEntity.driver === null) {
      driver = null;
    }

    let locations: LocationEntity[] | undefined = undefined;
    if (domainEntity.locations && domainEntity.locations.length > 0) {
      locations = domainEntity.locations.map((location) =>
        LocationMapper.toPersistence(location),
      );
    }

    const persistenceEntity = new DailyRideEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    if (ride) {
      persistenceEntity.ride = ride;
    }
    if (vehicle) {
      persistenceEntity.vehicle = vehicle;
    }
    persistenceEntity.driver = driver ?? null;
    persistenceEntity.kind = domainEntity.kind;
    persistenceEntity.date = domainEntity.date;
    persistenceEntity.start_time = domainEntity.start_time;
    persistenceEntity.end_time = domainEntity.end_time;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.meta = domainEntity.meta;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.locations = locations ?? [];
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_at = domainEntity.updated_at;
    return persistenceEntity;
  }
}
