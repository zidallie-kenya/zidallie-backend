import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RouteOfferService } from './route-offer.service';
import { ROUTE_OFFER_CASCADE_QUEUE } from './route-offer-constants';

interface RouteOfferJobData {
  routeOfferId: number;
}

@Processor(ROUTE_OFFER_CASCADE_QUEUE)
export class RouteOfferCascadeProcessor extends WorkerHost {
  private readonly logger = new Logger(RouteOfferCascadeProcessor.name);

  constructor(private readonly routeOfferService: RouteOfferService) {
    super();
  }

  async process(job: Job<RouteOfferJobData>): Promise<void> {
    switch (job.name) {
      case 'push-batch':
        return this.routeOfferService.pushBatch(job.data.routeOfferId);
      case 'cascade-deadline':
        return this.routeOfferService.handleDeadline(job.data.routeOfferId);
      default:
        this.logger.warn(
          `Unknown job name on ${ROUTE_OFFER_CASCADE_QUEUE}: ${job.name}`,
        );
    }
  }
}
