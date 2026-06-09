import { Booking } from '../../../../domain/booking';
import { BookingEntity } from '../entities/booking.entity';
import { CarpoolSchoolMapper } from './carpool-school.mapper';
import { BusSchoolMapper } from './bus-school.mapper';
import { PickupStationMapper } from './pickup-station.mapper';
import { ClusterMapper } from './cluster.mapper';
import { BookingChildMapper } from './booking-child.mapper';
import { BookingDepositMapper } from './booking-deposit.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CarpoolSchoolEntity } from '../entities/carpool-school.entity';
import { BusSchoolEntity } from '../entities/bus-school.entity';
import { PickupStationEntity } from '../entities/pickup-station.entity';
import { ClusterEntity } from '../entities/cluster.entity';

export class BookingMapper {
  static toDomain(entity: BookingEntity): Booking {
    return new Booking({
      id: entity.id,
      parent_id: entity.parent?.id,
      service_type: entity.service_type,
      term: entity.term,
      trip_type: entity.trip_type,
      children_count: entity.children_count,
      carpool_school: entity.carpool_school
        ? CarpoolSchoolMapper.toDomain(entity.carpool_school)
        : null,
      home_area: entity.home_area,
      home_lat: entity.home_lat ? Number(entity.home_lat) : null,
      home_lon: entity.home_lon ? Number(entity.home_lon) : null,
      bus_school: entity.bus_school
        ? BusSchoolMapper.toDomain(entity.bus_school)
        : null,
      pickup_station: entity.pickup_station
        ? PickupStationMapper.toDomain(entity.pickup_station)
        : null,
      region: entity.region,
      distance_km: entity.distance_km ? Number(entity.distance_km) : null,
      price_per_child: entity.price_per_child
        ? Number(entity.price_per_child)
        : null,
      total_price: entity.total_price ? Number(entity.total_price) : null,
      deposit_amount: entity.deposit_amount
        ? Number(entity.deposit_amount)
        : null,
      balance_amount: entity.balance_amount
        ? Number(entity.balance_amount)
        : null,
      cluster: entity.cluster ? ClusterMapper.toDomain(entity.cluster) : null,
      is_waitlisted: entity.is_waitlisted,
      status: entity.status,
      total_paid: Number(entity.total_paid),
      waitlist_started_at: entity.waitlist_started_at,
      children: entity.children
        ? entity.children.map(BookingChildMapper.toDomain)
        : [],
      deposits: entity.deposits
        ? entity.deposits.map(BookingDepositMapper.toDomain)
        : [],
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  }

  static toPersistence(domain: Booking): Partial<BookingEntity> {
    const entity = new BookingEntity();
    if (domain.id) entity.id = domain.id;
    entity.service_type = domain.service_type as any;
    entity.term = domain.term as any;
    entity.trip_type = domain.trip_type as any;
    entity.children_count = domain.children_count;
    entity.home_area = domain.home_area;
    entity.home_lat = domain.home_lat;
    entity.home_lon = domain.home_lon;
    entity.region = domain.region;
    entity.distance_km = domain.distance_km;
    entity.price_per_child = domain.price_per_child;
    entity.total_price = domain.total_price;
    entity.deposit_amount = domain.deposit_amount;
    entity.balance_amount = domain.balance_amount;
    entity.is_waitlisted = domain.is_waitlisted;
    entity.status = domain.status as any;
    entity.total_paid = domain.total_paid;
    entity.waitlist_started_at = domain.waitlist_started_at;

    if (domain.parent_id) {
      entity.parent = { id: domain.parent_id } as UserEntity;
    }
    if (domain.carpool_school?.id) {
      entity.carpool_school = {
        id: domain.carpool_school.id,
      } as CarpoolSchoolEntity;
    }
    if (domain.bus_school?.id) {
      entity.bus_school = { id: domain.bus_school.id } as BusSchoolEntity;
    }
    if (domain.pickup_station?.id) {
      entity.pickup_station = {
        id: domain.pickup_station.id,
      } as PickupStationEntity;
    }
    if (domain.cluster?.id) {
      entity.cluster = { id: domain.cluster.id } as ClusterEntity;
    }

    return entity;
  }
}
