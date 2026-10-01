import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RouteRepository } from './infrastructure/persistence/route.repository';
import { Route } from './domain/route';
import { QueryRouteDto } from './dto/query-route.dto';
import {
  ApproveRouteDto,
  ReassignDriverDto,
  SolveTermDto,
} from './dto/approve-route.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { RouteOfferService } from './route-offer.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly routeRepository: RouteRepository,
    @InjectQueue('route-solve') private readonly solveQueue: Queue,
    private readonly routeOfferService: RouteOfferService,
  ) {}

  findManyWithPagination(
    query: QueryRouteDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Route[]> {
    return this.routeRepository.findManyWithPagination({
      filterOptions: query.filters,
      sortOptions: query.sort,
      paginationOptions,
    });
  }

  async findById(id: number): Promise<Route> {
    const route = await this.routeRepository.findById(id);
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  findFlagged(term: string): Promise<Route[]> {
    return this.routeRepository.findFlagged(term);
  }

  /**
   * Stage 6 — admin approves a draft/flagged route. Optionally applies a
   * manual reorder first (drag-and-drop on the review map).
   *
   * REDESIGNED — per the current spec, the driver the batch solver
   * already picked for this route is not just "a" candidate: it MUST be
   * the first (and only, initially) driver offered the route. This used
   * to wipe driver_id/vehicle_id to null and re-rank every compliant
   * driver from scratch by pure proximity (startCascade), discarding the
   * solver's pick entirely and pushing to a batch of 10 strangers at
   * once. That directly contradicted "there is a driver that is
   * initially assigned to that route that should always be the first
   * driver in the rank."
   *
   * The FK is still cleared — same reasoning as before: a route whose
   * driver_id is set is treated as a real daily commitment by
   * driverHasCommittedRouteThatDay, and this driver hasn't committed to
   * anything yet, only been offered it. But the driver/vehicle ID is
   * captured BEFORE clearing and passed to RouteOfferService.initiateOffer
   * as the seed candidate, so they are guaranteed to be offer #1 rather
   * than re-ranked into the pool.
   */
  async approve(id: number, dto: ApproveRouteDto): Promise<Route> {
    const route = await this.findById(id);
    if (route.status !== 'draft' && route.status !== 'flagged') {
      throw new BadRequestException(
        `Route is already ${route.status} — only draft or flagged routes can be approved`,
      );
    }

    if (dto.reordered_stops?.length) {
      const stops = (route.stops ?? []).map((stop) => {
        const reordered = dto.reordered_stops!.find(
          (r) => r.route_stop_id === stop.id,
        );
        return reordered
          ? { ...stop, sequence_order: reordered.sequence_order }
          : stop;
      });
      await this.routeRepository.saveStops(id, stops as any);
    }

    // Capture the solver's pick before clearing it.
    const seedDriverId = route.driver_id ?? null;
    const seedVehicleId = route.vehicle_id ?? null;

    const updated = await this.routeRepository.update(id, {
      status: 'approved',
      driver_id: null as any,
      vehicle_id: null as any,
    });

    await this.routeOfferService.initiateOffer(id, {
      driverId: seedDriverId,
      vehicleId: seedVehicleId,
    });

    return updated!;
  }

  async reject(id: number, reason: string): Promise<Route> {
    const updated = await this.routeRepository.update(id, {
      status: 'cancelled',
      meta: { flagged_reason: reason },
    });
    if (!updated) throw new NotFoundException('Route not found');
    return updated;
  }

  /**
   * Manual admin override — admin names a specific replacement driver for
   * an already-active route (mid-term, driver fell through entirely —
   * distinct from the offer/decline flow above, which is
   * RouteOfferService.offerToDriver / handleDriverRemoved).
   */
  async reassignDriver(id: number, dto: ReassignDriverDto): Promise<Route> {
    const route = await this.findById(id);

    const replaced = await this.routeRepository.update(id, {
      status: 'cancelled',
      meta: {
        ...(route.meta ?? {}),
        flagged_reason: 'Superseded by driver reassignment',
      },
    });

    const newDraft = await this.routeRepository.create({
      term: route.term,
      service_type: route.service_type,
      kind: route.kind,
      trip_date: route.trip_date,
      driver_id: dto.new_driver_id,
      vehicle_id: dto.new_vehicle_id,
      carpool_school_id: route.carpool_school_id,
      bus_school_id: route.bus_school_id,
      status: 'draft',
      total_distance_km: null,
      total_duration_minutes: null,
      route_start_time: null,
      route_end_time: null,
      trip_amount: route.trip_amount,
      origin_latitude: dto.current_latitude ?? null,
      origin_longitude: dto.current_longitude ?? null,
      meta: { replaced_route_id: replaced!.id },
    });

    await this.solveQueue.add('resolve-single-route', {
      routeId: newDraft.id,
      originalRouteId: id,
    });

    return newDraft;
  }

  /** Stage 2's trigger — admin kicks off a full term solve; runs as a background job (see route-solve.processor.ts). */
  async triggerTermSolve(dto: SolveTermDto): Promise<{ job_id: string }> {
    const job = await this.solveQueue.add(
      'solve-term',
      {
        term: dto.term,
        tripDate: dto.trip_date,
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
    return { job_id: job.id! };
  }
}
