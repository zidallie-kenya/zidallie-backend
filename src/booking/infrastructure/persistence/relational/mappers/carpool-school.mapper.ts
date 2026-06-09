import { CarpoolSchool } from '../../../../domain/carpool-school';
import { CarpoolSchoolEntity } from '../entities/carpool-school.entity';

export class CarpoolSchoolMapper {
  static toDomain(entity: CarpoolSchoolEntity): CarpoolSchool {
    const domain = new CarpoolSchool();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.region = entity.region;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(domain: CarpoolSchool): CarpoolSchoolEntity {
    const entity = new CarpoolSchoolEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.region = domain.region;
    return entity;
  }
}
