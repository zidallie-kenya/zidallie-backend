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
import { mapRelation } from '../../../../../utils/relation.mapper';

export class DailyRideMapper {
  // converts the newly created entity to a domain
  static toDomain(raw: DailyRideEntity): DailyRide {
    //create a new domain instance
    const domainEntity = new DailyRide();

    //add the fields from the new created entity
    domainEntity.id = raw.id;
    domainEntity.ride = raw.ride ? RideMapper.toDomain(raw.ride) : null;
    domainEntity.vehicle = raw.vehicle
      ? VehicleMapper.toDomain(raw.vehicle)
      : null;
    domainEntity.driver = raw.driver ? UserMapper.toDomain(raw.driver) : null;

    domainEntity.kind = raw.kind;
    domainEntity.date = raw.date;
    domainEntity.start_time = raw.start_time;
    domainEntity.end_time = raw.end_time;
    domainEntity.comments = raw.comments;
    domainEntity.meta = raw.meta;
    domainEntity.status = raw.status;
    domainEntity.embark_time = raw.embark_time;
    domainEntity.disembark_time = raw.disembark_time;

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

  static toPersistence(
    domainEntity: Partial<DailyRide>,
  ): Partial<DailyRideEntity> {
    const persistence: Partial<DailyRideEntity> = {};

    //simple fields
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.kind !== undefined) persistence.kind = domainEntity.kind;
    if (domainEntity.date !== undefined) persistence.date = domainEntity.date;
    if (domainEntity.start_time !== undefined)
      persistence.start_time = domainEntity.start_time;
    if (domainEntity.end_time !== undefined)
      persistence.end_time = domainEntity.end_time;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
    if (domainEntity.status !== undefined)
      persistence.status = domainEntity.status;
    if (domainEntity.embark_time !== undefined)
      persistence.embark_time = domainEntity.embark_time;
    if (domainEntity.disembark_time !== undefined)
      persistence.disembark_time = domainEntity.disembark_time;

    //relations

    //ride
    persistence.ride =
      (mapRelation(domainEntity.ride, RideMapper) as RideEntity) || undefined;
    //vehicle
    persistence.vehicle =
      (mapRelation(domainEntity.vehicle, VehicleMapper) as VehicleEntity) ||
      undefined;
    //driver
    persistence.driver =
      (mapRelation(domainEntity.driver, UserMapper) as UserEntity) || undefined;
    //locations
    if (domainEntity.locations !== undefined) {
      persistence.locations = domainEntity.locations.map((location) =>
        LocationMapper.toPersistence(location),
      ) as LocationEntity[];
    }

    return persistence;
  }
}
