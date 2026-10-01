import { RouteOffer } from '../../../../domain/route-offer';
import { RouteOfferAttempt } from '../../../../domain/route-offer-attempt';
import { RouteOfferEntity } from '../entities/route-offer.entity';
import { RouteOfferAttemptEntity } from '../entities/route-offer-attempt.entity';

export class RouteOfferMapper {
  static toDomain(entity: RouteOfferEntity): RouteOffer {
    const domain = new RouteOffer();
    domain.id = entity.id;
    domain.route_id = entity.route_id;
    domain.candidates = entity.candidates;
    domain.current_batch_start_index = entity.current_batch_start_index;
    domain.current_batch_pushed_at = entity.current_batch_pushed_at;
    domain.cascade_started_at = entity.cascade_started_at;
    domain.cascade_deadline_at = entity.cascade_deadline_at;
    domain.status = entity.status;
    domain.accepted_driver_id = entity.accepted_driver_id;
    domain.accepted_vehicle_id = entity.accepted_vehicle_id;
    domain.created_at = entity.created_at;
    domain.updated_at = entity.updated_at;
    if (entity.attempts) {
      domain.attempts = entity.attempts.map(RouteOfferAttemptMapper.toDomain);
    }
    return domain;
  }

  static toEntity(domain: Partial<RouteOffer>): Partial<RouteOfferEntity> {
    const entity: Partial<RouteOfferEntity> = {
      candidates: domain.candidates,
      current_batch_start_index: domain.current_batch_start_index,
      current_batch_pushed_at: domain.current_batch_pushed_at,
      cascade_started_at: domain.cascade_started_at,
      cascade_deadline_at: domain.cascade_deadline_at,
      status: domain.status,
      accepted_driver_id: domain.accepted_driver_id,
      accepted_vehicle_id: domain.accepted_vehicle_id,
    };
    if (domain.route_id !== undefined) {
      entity.route = { id: domain.route_id } as any;
      entity.route_id = domain.route_id;
    }
    return entity;
  }
}

export class RouteOfferAttemptMapper {
  static toDomain(entity: RouteOfferAttemptEntity): RouteOfferAttempt {
    const domain = new RouteOfferAttempt();
    domain.id = entity.id;
    domain.route_offer_id = entity.route_offer_id;
    domain.driver_id = entity.driver_id;
    domain.vehicle_id = entity.vehicle_id;
    domain.pushed_at = entity.pushed_at;
    domain.responded_at = entity.responded_at;
    domain.response = entity.response;
    domain.created_at = entity.created_at;
    return domain;
  }

  static toEntity(
    domain: Partial<RouteOfferAttempt>,
  ): Partial<RouteOfferAttemptEntity> {
    const entity: Partial<RouteOfferAttemptEntity> = {
      driver_id: domain.driver_id,
      vehicle_id: domain.vehicle_id,
      pushed_at: domain.pushed_at,
      responded_at: domain.responded_at,
      response: domain.response,
    };
    if (domain.route_offer_id !== undefined) {
      entity.route_offer = { id: domain.route_offer_id } as any;
      entity.route_offer_id = domain.route_offer_id;
    }
    return entity;
  }
}
