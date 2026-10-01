import { RouteOfferAttempt } from './route-offer-attempt';
import {
  RouteOfferCandidate,
  RouteOfferStatus,
} from '../infrastructure/persistence/relational/entities/route-offer.entity';

export class RouteOffer {
  id!: number;
  route_id!: number;
  candidates!: RouteOfferCandidate[];
  current_batch_start_index!: number;
  current_batch_pushed_at?: Date | null;
  cascade_started_at!: Date;
  cascade_deadline_at!: Date;
  status!: RouteOfferStatus;
  accepted_driver_id?: number | null;
  accepted_vehicle_id?: number | null;
  attempts?: RouteOfferAttempt[];
  created_at!: Date;
  updated_at!: Date;
}
