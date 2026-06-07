import { BusSchool } from '../../../../domain/bus-school';
import { BusSchoolEntity } from '../entities/bus-school.entity';

export class BusSchoolMapper {
  static toDomain(entity: BusSchoolEntity): BusSchool {
    const domain = new BusSchool();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.region = entity.region;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(domain: BusSchool): BusSchoolEntity {
    const entity = new BusSchoolEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.region = domain.region;
    return entity;
  }
}
