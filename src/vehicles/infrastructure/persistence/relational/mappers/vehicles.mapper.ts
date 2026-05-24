import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { DailyRideMapper } from '../../../../../daily_rides/infrastructure/persistence/relational/mappers/daily_rides.mapper';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideMapper } from '../../../../../rides/infrastructure/persistence/relational/mappers/ride.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { Vehicle } from '../../../../domain/vehicles';
import { VehicleEntity } from '../entities/vehicle.entity';
import { VehicleReportEntity } from '../entities/vehicle_report.entity';

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
    domainEntity.minders_name = raw.minders_name;
    domainEntity.minders_id_url = raw.minders_id_url;

    if (raw.vehicle_report) {
      domainEntity.vehicle_report = raw.vehicle_report.map((report) => ({
        id: report.id,
        report_url: report.report_url,
        file_name: report.file_name,
        created_at: report.created_at,
        vehicleId: report.vehicleId,
      }));
    } else {
      domainEntity.vehicle_report = [];
    }
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

  static toPersistence(domainEntity: Partial<Vehicle>): Partial<VehicleEntity> {
    const persistence: Partial<VehicleEntity> = {};

    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.vehicle_name !== undefined)
      persistence.vehicle_name = domainEntity.vehicle_name;
    if (domainEntity.registration_number !== undefined)
      persistence.registration_number = domainEntity.registration_number;

    if (domainEntity.vehicle_type !== undefined)
      persistence.vehicle_type = domainEntity.vehicle_type;

    if (domainEntity.vehicle_model !== undefined)
      persistence.vehicle_model = domainEntity.vehicle_model;

    if (domainEntity.vehicle_year !== undefined)
      persistence.vehicle_year = domainEntity.vehicle_year;

    if (domainEntity.vehicle_image_url !== undefined)
      persistence.vehicle_image_url = domainEntity.vehicle_image_url;

    if (domainEntity.seat_count !== undefined)
      persistence.seat_count = domainEntity.seat_count;

    if (domainEntity.available_seats !== undefined)
      persistence.available_seats = domainEntity.available_seats;

    if (domainEntity.is_inspected !== undefined)
      persistence.is_inspected = domainEntity.is_inspected;

    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;

    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;

    if (domainEntity.vehicle_registration !== undefined)
      persistence.vehicle_registration = domainEntity.vehicle_registration;

    if (domainEntity.insurance_certificate !== undefined)
      persistence.insurance_certificate = domainEntity.insurance_certificate;

    if (domainEntity.vehicle_data !== undefined)
      persistence.vehicle_data = domainEntity.vehicle_data;

    if (domainEntity.status !== undefined)
      persistence.status = domainEntity.status;

    if (domainEntity.minders_name !== undefined)
      persistence.minders_name = domainEntity.minders_name;

    if (domainEntity.minders_id_url !== undefined)
      persistence.minders_id_url = domainEntity.minders_id_url;

    //arrays
    if (domainEntity.rides !== undefined) {
      persistence.rides = domainEntity.rides.map(
        (ride) => RideMapper.toPersistence(ride) as RideEntity,
      );
    }
    if (domainEntity.daily_rides !== undefined) {
      persistence.daily_rides = domainEntity.daily_rides.map(
        (dailyRide) =>
          DailyRideMapper.toPersistence(dailyRide) as DailyRideEntity,
      );
    }

    if (domainEntity.vehicle_report !== undefined) {
      // Map domain array to our Entity relationship array
      persistence.vehicle_report = domainEntity.vehicle_report.map(
        (report: any) => {
          const reportEntity = new VehicleReportEntity();
          if (report.id) reportEntity.id = report.id;
          reportEntity.report_url = report.report_url;
          reportEntity.file_name = report.file_name;
          reportEntity.vehicleId = domainEntity.id as number;
          return reportEntity;
        },
      );

      // Update the physical ID column with the first report's ID
      if (domainEntity.vehicle_report.length > 0) {
        persistence.latest_report_id = domainEntity.vehicle_report[0].id;
      }
    }

    //relations
    //user
    persistence.user =
      (mapRelation(domainEntity.user, UserMapper) as UserEntity) || undefined;

    return persistence;
  }
}
