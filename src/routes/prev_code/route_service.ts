import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RouteRepository } from '../infrastructure/persistence/route.repository';
import { QueryRouteDto } from '../dto/query-route.dto';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { Route } from '../domain/route';
import {
  ApproveRouteDto,
  ReassignDriverDto,
  SolveTermDto,
} from '../dto/approve-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    private readonly routeRepository: RouteRepository,
    @InjectQueue('route-solve') private readonly solveQueue: Queue,
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
   * manual reorder first (drag-and-drop on the review map). Approval alone
   * does NOT create ride/daily_ride rows — that's a separate step
   * (Stage 7, triggered from wherever assignRide already lives), kept
   * distinct so "approved" and "rides actually created" can't silently
   * drift out of sync if that second step fails partway.
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

    const updated = await this.routeRepository.update(id, {
      status: 'approved',
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
   * Mid-term driver swap — see Route.origin_latitude/longitude. This
   * doesn't re-solve inline (that's a solver call, seconds not
   * milliseconds); it marks the route for re-solve and lets the same
   * BullMQ worker pick it up, keeping this method fast for the admin UI
   * that calls it.
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
        tripDate: dto.trip_date, // Map snake_case to camelCase
      },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
    return { job_id: job.id! };
  }
}
