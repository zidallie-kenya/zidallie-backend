import { RouteOfferAttemptResponse } from '../infrastructure/persistence/relational/entities/route-offer-attempt.entity';

export class RouteOfferAttempt {
  id!: number;
  route_offer_id!: number;
  driver_id!: number;
  vehicle_id!: number;
  pushed_at!: Date;
  responded_at?: Date | null;
  response!: RouteOfferAttemptResponse;
  created_at!: Date;
}
