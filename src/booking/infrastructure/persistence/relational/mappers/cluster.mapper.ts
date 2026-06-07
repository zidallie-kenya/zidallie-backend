import { Cluster } from '../../../../domain/cluster';
import { ClusterEntity } from '../entities/cluster.entity';

export class ClusterMapper {
  static toDomain(entity: ClusterEntity): Cluster {
    return new Cluster({
      id: entity.id,
      name: entity.name,
      zone: entity.zone,
      max_capacity: entity.max_capacity,
      is_active: entity.is_active,
      term: entity.term,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  }

  static toPersistence(domain: Cluster): ClusterEntity {
    const entity = new ClusterEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.zone = domain.zone;
    entity.max_capacity = domain.max_capacity;
    entity.is_active = domain.is_active;
    entity.term = domain.term;
    return entity;
  }
}
