import { PickupStation } from '../../../../domain/pickup-station';
import { PickupStationEntity } from '../entities/pickup-station.entity';

export class PickupStationMapper {
  static toDomain(entity: PickupStationEntity): PickupStation {
    const domain = new PickupStation();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.region = entity.region;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    domain.latitude = entity.latitude;
    domain.longitude = entity.longitude;
    return domain;
  }

  static toPersistence(domain: PickupStation): PickupStationEntity {
    const entity = new PickupStationEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.region = domain.region;
    entity.latitude = domain.latitude;
    entity.longitude = domain.longitude;
    return entity;
  }
}
