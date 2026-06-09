import { Pricing } from '../../../../domain/pricing';
import { PricingEntity } from '../entities/pricing.entity';

export class PricingMapper {
  static toDomain(entity: PricingEntity): Pricing {
    const domain = new Pricing();
    domain.id = entity.id;
    domain.region = entity.region;
    domain.service_type = entity.service_type;
    domain.distance_range = entity.distance_range;
    domain.max_km = entity.max_km;
    domain.price = Number(entity.price);
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    return domain;
  }

  static toPersistence(domain: Pricing): PricingEntity {
    const entity = new PricingEntity();
    entity.id = domain.id;
    entity.region = domain.region;
    entity.service_type = domain.service_type;
    entity.distance_range = domain.distance_range;
    entity.max_km = domain.max_km;
    entity.price = domain.price;
    return entity;
  }
}
