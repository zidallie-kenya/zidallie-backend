import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Vehicle } from '../../../../domain/vehicles';
import { VehicleEntity } from '../entities/vehicle.entity';

export class VehicleMapper {
  static toDomain(raw: VehicleEntity): Vehicle {
    if (!raw) {
      // throw or return a default Vehicle instance here
      throw new Error('Cannot map null VehicleEntity');
    }

    const domainEntity = new Vehicle();
    domainEntity.id = raw.id;
    domainEntity.vehicle_name = raw.vehicle_name;

    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    } else {
      domainEntity.user = null;
    }

    domainEntity.vehicle_name = raw.vehicle_name;
    domainEntity.registration_number = raw.registration_number;
    domainEntity.vehicle_type = raw.vehicle_type;
    domainEntity.vehicle_model = raw.vehicle_model;
    domainEntity.vehicle_year = raw.vehicle_year;
    domainEntity.vehicle_image_url = raw.vehicle_image_url;
    domainEntity.seat_count = raw.seat_count;
    domainEntity.available_seats = raw.available_seats;
    domainEntity.is_inspected = raw.is_inspected;
    domainEntity.comments = raw.comments;
    domainEntity.meta = raw.meta;
    domainEntity.vehicle_registration = raw.vehicle_registration;
    domainEntity.insurance_certificate = raw.insurance_certificate;
    domainEntity.vehicle_data = raw.vehicle_data;
    domainEntity.status = raw.status;

    if (raw.rides) {
      domainEntity.rides = raw.rides.map((ride) => RideMapper.toDomain(ride));
    } else {
      domainEntity.rides = [];
    }

    if (raw.daily_rides) {
      domainEntity.daily_rides = raw.daily_rides.map((dailyRide) =>
        DailyRideMapper.toDomain(dailyRide),
      );
    } else {
      domainEntity.daily_rides = [];
    }

    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Vehicle): VehicleEntity {
    let user: UserEntity | undefined | null = undefined;
    if (domainEntity.user) {
      user = UserMapper.toPersistence(domainEntity.user);
    } else if (domainEntity.user === null) {
      user = null;
    }

    let rides: RideEntity[] | undefined = undefined;
    if (domainEntity.rides) {
      rides = domainEntity.rides.map((ride) => RideMapper.toPersistence(ride));
    }

    let daily_rides: DailyRideEntity[] | undefined = undefined;
    if (domainEntity.daily_rides) {
      daily_rides = domainEntity.daily_rides.map((dailyRide) =>
        DailyRideMapper.toPersistence(dailyRide),
      );
    }

    const persistenceEntity = new VehicleEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user = user === undefined ? null : user;
    persistenceEntity.vehicle_name = domainEntity.vehicle_name;
    persistenceEntity.registration_number = domainEntity.registration_number;
    persistenceEntity.vehicle_type = domainEntity.vehicle_type;
    persistenceEntity.vehicle_model = domainEntity.vehicle_model;
    persistenceEntity.vehicle_year = domainEntity.vehicle_year;
    persistenceEntity.vehicle_image_url = domainEntity.vehicle_image_url;
    persistenceEntity.seat_count = domainEntity.seat_count;
    persistenceEntity.available_seats = domainEntity.available_seats;
    persistenceEntity.is_inspected = domainEntity.is_inspected;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.meta = domainEntity.meta;
    persistenceEntity.vehicle_registration = domainEntity.vehicle_registration;
    persistenceEntity.insurance_certificate =
      domainEntity.insurance_certificate;
    persistenceEntity.vehicle_data = domainEntity.vehicle_data;
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.rides = rides ?? [];
    persistenceEntity.daily_rides = daily_rides ?? [];
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_at = domainEntity.updated_at;
    return persistenceEntity;
  }
}
