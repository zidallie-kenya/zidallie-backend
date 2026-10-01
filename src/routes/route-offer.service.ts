import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource, EntityManager, In, Not } from 'typeorm';
import {
  CarpoolCluster,
  DriverCandidate,
  StopCandidate,
  haversineKm,
} from './clustering.service';
import { RouteSolverService } from './route-solver.service';
import { SolveRequest, SolveResponse } from './route-solver.client';
import { DriverComplianceService } from './driver-compliance.service';
import { RouteEntity } from './infrastructure/persistence/relational/entities/route.entity';
import {
  RouteOfferCandidate,
  RouteOfferEntity,
} from './infrastructure/persistence/relational/entities/route-offer.entity';
import { RouteOfferAttemptEntity } from './infrastructure/persistence/relational/entities/route-offer-attempt.entity';
import { VehicleEntity } from '../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import {
  CASCADE_TOTAL_CAP_HOURS,
  MAX_CHILDREN_PER_ROUTE,
  OFFER_BATCH_SIZE,
  ROUTE_OFFER_CASCADE_QUEUE,
} from './route-offer-constants';
import {
  ROUTE_OFFER_NOTIFICATIONS,
  RouteOfferNotifications,
} from './route-offer-notifications.port';
import {
  RideStatus,
  DailyRideKind,
  DailyRideStatus,
} from '../utils/types/enums';
import { DailyRideEntity } from '../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RideEntity } from '../rides/infrastructure/persistence/relational/entities/ride.entity';
import { RideSchedule } from '../utils/types/ride-schedule';

// Same rules the batch solver enforces — see route-solve.processor.ts.
// Self-contained here (rather than importing the processor's private
// buildSolveRequest) since this only ever needs one vehicle in the
// request, run once, at the moment someone actually accepts.
const SOLVER_TIME_LIMIT_SECONDS = 30;
const PICKUP_LEAD_TIME_S = 60 * 60;
const DROPOFF_BOARDING_WINDOW_S = 40 * 60;
// Rule 6 — kept in sync with clustering.service's tolerance and the
// solver's own default so a forgotten override here never silently
// reintroduces a stricter window than the rest of the system uses.
const MAX_TIMING_DIFF_S = 60 * 60;

// ------------------------------------------------------------------
// Shapes returned to the driver app for the offer/accept-decline screen
// and the Uber-style navigation screen. Kept here (rather than a shared
// dto file) since they're thin read-models built straight off the
// entities below, not persisted anywhere themselves.
// ------------------------------------------------------------------
export interface DriverOfferStop {
  student_id: number | null;
  student_name: string;
  sequence_order: number;
  latitude: number;
  longitude: number;
  address_label: string | null;
  time_window_start: string;
  time_window_end: string;
}

export interface DriverPendingOffer {
  route_id: number;
  offer_attempt_id: number;
  kind: 'pickup' | 'dropoff';
  school: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  } | null;
  total_distance_km: number | null;
  trip_amount: number | null;
  distance_from_you_km: number;
  stops: DriverOfferStop[];
}

export interface DriverActiveRouteStop {
  student_id: number | null;
  student_name: string;
  sequence_order: number;
  latitude: number;
  longitude: number;
  address_label: string | null;
  status: string;
}

export interface DriverActiveRoute {
  route_id: number;
  kind: 'pickup' | 'dropoff';
  school: { name: string; latitude: number; longitude: number } | null;
  stops: DriverActiveRouteStop[];
}

@Injectable()
export class RouteOfferService {
  private readonly logger = new Logger(RouteOfferService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly routeSolver: RouteSolverService,
    private readonly compliance: DriverComplianceService,
    @InjectQueue(ROUTE_OFFER_CASCADE_QUEUE)
    private readonly cascadeQueue: Queue,
    @Inject(ROUTE_OFFER_NOTIFICATIONS)
    private readonly notifications: RouteOfferNotifications,
  ) {}
  // ------------------------------------------------------------------
  // Rank compliant, proximity-eligible, not-already-booked-today drivers
  // by proximity to the route's first stop, seed the solver's own pick as
  // candidate #1 if one was captured, then push the first batch (size
  // OFFER_BATCH_SIZE — currently 1, see route-offer-constants.ts) and
  // schedule the deadline job.
  //
  // Rule 6 — no seat-capacity/available_seats filtering here anymore.
  // Every vehicle in a solve is capped by the shared, adjustable
  // max_children_per_route on the solver side; per-vehicle seat counts
  // are no longer a concept in this pipeline.
  // ------------------------------------------------------------------
  async initiateOffer(
    routeId: number,
    seed: { driverId: number | null; vehicleId: number | null },
  ): Promise<RouteOfferEntity> {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({
      where: { id: routeId },
      relations: [
        'stops',
        'stops.student',
        'stops.booking_child',
        'carpool_school',
      ],
    });
    if (!route) throw new NotFoundException('Route not found');

    const firstStop = [...route.stops].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    )[0];
    const anchor = {
      lat: Number(firstStop.latitude),
      lon: Number(firstStop.longitude),
    };

    const vehicles = await this.dataSource.getRepository(VehicleEntity).find({
      where: { is_inspected: true },
      relations: ['user', 'user.kyc'],
    });

    const proximityRanked = this.compliance
      .filterCompliant(vehicles)
      .filter((v) => v.user?.meta?.address?.home_latitude != null)
      .map((v) => ({
        driver_id: v.user!.id,
        vehicle_id: v.id,
        distance_km:
          Math.round(
            haversineKm(anchor, {
              lat: v.user!.meta!.address!.home_latitude!,
              lon: v.user!.meta!.address!.home_longitude!,
            }) * 100,
          ) / 100,
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    let candidates: RouteOfferCandidate[] = [];

    for (const c of proximityRanked) {
      if (
        !(await this.driverHasCommittedRouteThatDay(
          c.driver_id,
          route.trip_date,
          route.kind,
          route.id,
        ))
      ) {
        candidates.push(c);
      }
    }
    this.logger.log(
      `initiateOffer: route #${routeId} — ${candidates.length} eligible candidate(s): ` +
        candidates
          .map((c) => `driver#${c.driver_id}(${c.distance_km}km)`)
          .join(', '),
    );
    // Seed the solver's own pick for this route as candidate #1, ahead of
    // pure proximity ranking — see RoutesService.approve, which captures
    // route.driver_id/vehicle_id before clearing them. Only honored if
    // that driver still clears the same eligibility bar as everyone else:
    // approval can happen hours or days after the batch solve ran, so
    // compliance, home-location data, and same-day availability are none
    // of them guaranteed to still hold.
    if (seed.driverId != null && seed.vehicleId != null) {
      const existingIdx = candidates.findIndex(
        (c) => c.driver_id === seed.driverId,
      );
      if (existingIdx !== -1) {
        // Already eligible, just not naturally first by proximity — move
        // them to the front rather than re-ranking everyone else.
        const [seeded] = candidates.splice(existingIdx, 1);
        candidates = [seeded, ...candidates];
      } else {
        // Not in the eligible pool at all. Check why: if it's merely that
        // they're already committed to something else today, leave them
        // out — offering would just fail the moment they tried to accept.
        // If it's a stale compliance/home-location issue, same thing.
        const seedVehicle = vehicles.find(
          (v) => v.id === seed.vehicleId && v.user?.id === seed.driverId,
        );
        const stillCompliant =
          !!seedVehicle &&
          this.compliance.filterCompliant([seedVehicle]).length > 0;
        const hasHome = seedVehicle?.user?.meta?.address?.home_latitude != null;

        if (stillCompliant && hasHome) {
          const alreadyCommitted = await this.driverHasCommittedRouteThatDay(
            seed.driverId,
            route.trip_date,
            route.kind,
            route.id,
          );
          if (!alreadyCommitted) {
            const distance_km =
              Math.round(
                haversineKm(anchor, {
                  lat: seedVehicle!.user!.meta!.address!.home_latitude!,
                  lon: seedVehicle!.user!.meta!.address!.home_longitude!,
                }) * 100,
              ) / 100;
            candidates = [
              {
                driver_id: seed.driverId,
                vehicle_id: seed.vehicleId,
                distance_km,
              },
              ...candidates,
            ];
          } else {
            this.logger.warn(
              `initiateOffer: seed driver #${seed.driverId} for route #${routeId} ` +
                `is already committed elsewhere today — falling back to proximity ranking`,
            );
          }
        } else {
          this.logger.warn(
            `initiateOffer: seed driver #${seed.driverId} for route #${routeId} ` +
              `no longer eligible (compliance or home location) — falling back to proximity ranking`,
          );
        }
      }
    }

    const totalCandidates = candidates.length;
    const calculatedCapHours = Math.min(
      CASCADE_TOTAL_CAP_HOURS,
      Math.max(2, totalCandidates * 0.5),
    );
    const deadlineTimeMs = Date.now() + calculatedCapHours * 60 * 60 * 1000;

    const offer = await this.dataSource.getRepository(RouteOfferEntity).save({
      route_id: route.id,
      candidates,
      current_batch_start_index: 0,
      cascade_started_at: new Date(),
      cascade_deadline_at: new Date(deadlineTimeMs),
      status: 'pending',
    });

    await this.cascadeQueue.add('push-batch', { routeOfferId: offer.id });
    return offer;
  }

  // Thin wrapper kept for callers with no solver pick to seed — e.g.
  // handleDriverRemoved, where the previous driver just fell out and
  // there's nothing to prioritize, only a fresh proximity ranking.
  async startCascade(routeId: number): Promise<RouteOfferEntity> {
    return this.initiateOffer(routeId, { driverId: null, vehicleId: null });
  }

  async accept(routeId: number, driverId: number): Promise<RouteEntity> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);

    // Plain read — no lock. The atomic conditional UPDATE below is what
    // actually prevents two accepts racing; a pessimistic lock held across
    // the solver call was both broken (no open transaction, hence
    // PessimisticLockTransactionRequiredError) and needlessly expensive.
    const offer = await offerRepo.findOne({
      where: { route_id: routeId, status: 'pending' },
    });
    if (!offer) throw new BadRequestException('Offer no longer available');

    const attemptRepo = this.dataSource.getRepository(RouteOfferAttemptEntity);
    const attempt = await attemptRepo.findOne({
      where: {
        route_offer_id: offer.id,
        driver_id: driverId,
        response: 'pending',
      },
    });
    if (!attempt) throw new BadRequestException('No pending offer for you.');

    const route = await this.dataSource
      .getRepository(RouteEntity)
      .findOneBy({ id: routeId });
    if (!route) throw new NotFoundException('Route not found');

    if (
      await this.driverHasCommittedRouteThatDay(
        driverId,
        route.trip_date,
        route.kind,
        routeId,
      )
    ) {
      await attemptRepo.update(attempt.id, {
        response: 'declined',
        responded_at: new Date(),
      });
      throw new BadRequestException(
        'You are already committed to a route this day.',
      );
    }

    // ATOMIC CLAIM — the real concurrency guard. Postgres only lets one
    // concurrent UPDATE ... WHERE status = 'pending' succeed; a second
    // caller (double-tap, or in theory a second driver) gets affected=0
    // and is rejected cleanly instead of both racing past this point.
    const claim = await offerRepo.update(
      { id: offer.id, status: 'pending' },
      {
        status: 'accepted',
        accepted_driver_id: driverId,
        accepted_vehicle_id: attempt.vehicle_id,
      },
    );
    if (claim.affected !== 1) {
      throw new BadRequestException('Offer no longer available');
    }

    const solveResult = await this.trySolveForCandidate(routeId, {
      driver_id: driverId,
      vehicle_id: attempt.vehicle_id,
      distance_km: 0,
    });

    if (!solveResult) {
      // Release the claim so the cascade can move on to the next
      // candidate instead of being stuck "accepted" with nobody actually
      // committed to the route.
      await offerRepo.update(offer.id, {
        status: 'pending',
        accepted_driver_id: null as any,
        accepted_vehicle_id: null as any,
      });
      await attemptRepo.update(attempt.id, {
        response: 'infeasible_on_accept',
        responded_at: new Date(),
      });
      await this.maybeAdvanceBatch(offer.id);
      throw new BadRequestException('Route no longer fits your schedule.');
    }

    await attemptRepo.update(attempt.id, {
      response: 'accepted',
      responded_at: new Date(),
    });

    return this.commitDriverToRoute(
      routeId,
      driverId,
      attempt.vehicle_id,
      solveResult.response,
    );
  }

  // ------------------------------------------------------------------
  // Called by RouteOfferCascadeProcessor.
  // ------------------------------------------------------------------
  async pushBatch(routeOfferId: number): Promise<void> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);
    const offer = await offerRepo.findOne({ where: { id: routeOfferId } });
    if (!offer || offer.status !== 'pending') {
      this.logger.warn(
        `pushBatch: offer #${routeOfferId} is ${offer ? `status=${offer.status}` : 'missing'} — skipping`,
      );
      return;
    }

    if (new Date() >= offer.cascade_deadline_at) {
      await this.exhaustCascade(
        offer.id,
        '24-hour cascade window elapsed with no acceptance',
      );
      return;
    }

    const batch = offer.candidates.slice(
      offer.current_batch_start_index,
      offer.current_batch_start_index + OFFER_BATCH_SIZE,
    );

    this.logger.log(
      `pushBatch: offer #${routeOfferId} — index ${offer.current_batch_start_index}/${offer.candidates.length} total candidates, batch size ${batch.length}`,
    );

    if (batch.length === 0) {
      await this.exhaustCascade(
        offer.id,
        'Every candidate driver was tried and none accepted',
      );
      return;
    }

    const route = await this.dataSource.getRepository(RouteEntity).findOne({
      where: { id: offer.route_id },
      relations: ['stops'],
    });
    if (!route) return;

    const now = new Date();
    const attemptRepo = this.dataSource.getRepository(RouteOfferAttemptEntity);

    for (const candidate of batch) {
      await attemptRepo.save({
        route_offer_id: offer.id,
        driver_id: candidate.driver_id,
        vehicle_id: candidate.vehicle_id,
        pushed_at: now,
        response: 'pending',
      });

      await this.notifications.sendDriverRouteOffer({
        driverId: candidate.driver_id,
        routeId: offer.route_id,
        kind: route.kind,
        studentCount: route.stops.length,
        distanceKm: candidate.distance_km,
      });
    }

    await offerRepo.update(offer.id, { current_batch_pushed_at: now });
  }

  async decline(routeId: number, driverId: number): Promise<void> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);
    const offer = await offerRepo.findOne({
      where: { route_id: routeId, status: 'pending' },
    });
    if (!offer) {
      this.logger.warn(
        `decline: no PENDING offer found for route #${routeId} — nothing to do. ` +
          `(Either it was already resolved, or the offer/candidate flow never started correctly.)`,
      );
      return;
    }

    const attemptRepo = this.dataSource.getRepository(RouteOfferAttemptEntity);
    const attempt = await attemptRepo.findOne({
      where: {
        route_offer_id: offer.id,
        driver_id: driverId,
        response: 'pending',
      },
      order: { id: 'DESC' },
    });
    if (!attempt) {
      this.logger.warn(
        `decline: driver #${driverId} has no PENDING attempt on offer #${offer.id} ` +
          `(route #${routeId}) — nothing to do.`,
      );
      return;
    }

    await attemptRepo.update(attempt.id, {
      response: 'declined',
      responded_at: new Date(),
    });

    this.logger.log(
      `decline: driver #${driverId} declined route #${routeId} ` +
        `(offer #${offer.id}, was batch index ${offer.current_batch_start_index}) — advancing`,
    );

    await this.maybeAdvanceBatch(offer.id);
  }

  private async maybeAdvanceBatch(routeOfferId: number): Promise<void> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);
    const offer = await offerRepo.findOne({ where: { id: routeOfferId } });
    if (!offer || offer.status !== 'pending') {
      this.logger.warn(
        `maybeAdvanceBatch: offer #${routeOfferId} is ${
          offer ? `status=${offer.status}` : 'missing'
        } — not advancing`,
      );
      return;
    }

    const attemptRepo = this.dataSource.getRepository(RouteOfferAttemptEntity);
    const stillPending = await attemptRepo.count({
      where: { route_offer_id: offer.id, response: 'pending' },
    });
    if (stillPending > 0) {
      this.logger.log(
        `maybeAdvanceBatch: offer #${routeOfferId} still has ${stillPending} pending attempt(s) — not advancing yet`,
      );
      return;
    }

    const nextIndex = offer.current_batch_start_index + OFFER_BATCH_SIZE;
    this.logger.log(
      `maybeAdvanceBatch: offer #${routeOfferId} has ${offer.candidates.length} total candidates, ` +
        `advancing to index ${nextIndex}`,
    );

    await offerRepo.update(offer.id, { current_batch_start_index: nextIndex });
    await this.cascadeQueue.add(
      'push-batch',
      { routeOfferId: offer.id },
      { delay: 0 },
    );
  }

  // Called by RouteOfferCascadeProcessor when the 24hr deadline job fires.
  async handleDeadline(routeOfferId: number): Promise<void> {
    const offer = await this.dataSource
      .getRepository(RouteOfferEntity)
      .findOne({ where: { id: routeOfferId } });
    if (!offer || offer.status !== 'pending') return; // already resolved
    await this.exhaustCascade(
      offer.id,
      '24-hour cascade window elapsed with no acceptance',
    );
  }

  // ------------------------------------------------------------------
  // Rule 16 — mid-term driver replacement
  // ------------------------------------------------------------------
  async handleDriverRemoved(routeId: number, reason: string): Promise<void> {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');

    const previousDriverId = route.driver?.id ?? null;

    await routeRepo.update(routeId, {
      driver: null as any,
      vehicle: null as any,
    });

    // "an alarm is raised to admin within 1 hour" — fired immediately
    // here, well inside that bound.
    await this.notifications.sendAdminAlert({
      subject: `Driver removed from route #${routeId}`,
      message: `${reason}. Route #${routeId} (previously driver ${previousDriverId ?? 'unknown'}) is back in the offer cascade to find a replacement.`,
      routeId,
    });

    await this.startCascade(routeId);
  }

  // ------------------------------------------------------------------
  // Rule 13 step 6 — admin manual assignment after the cascade is
  // exhausted (or an admin choosing to short-circuit it at any point).
  // ------------------------------------------------------------------
  async manualAssign(
    routeId: number,
    driverId: number,
    vehicleId: number,
  ): Promise<RouteEntity> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);
    const offer = await offerRepo.findOne({
      where: { route_id: routeId },
      order: { id: 'DESC' },
    });
    if (offer && offer.status === 'pending') {
      await offerRepo.update(offer.id, { status: 'cancelled' });
      await this.dataSource
        .getRepository(RouteOfferAttemptEntity)
        .update(
          { route_offer_id: offer.id, response: 'pending' },
          { response: 'superseded', responded_at: new Date() },
        );
    }

    const solveResult = await this.trySolveForCandidate(routeId, {
      driver_id: driverId,
      vehicle_id: vehicleId,
      distance_km: 0,
    });
    if (!solveResult) {
      throw new BadRequestException(
        'The solver could not build a valid route for this driver — try a different one.',
      );
    }

    return this.commitDriverToRoute(
      routeId,
      driverId,
      vehicleId,
      solveResult.response,
    );
  }

  // ------------------------------------------------------------------
  // Driver-facing reads
  // ------------------------------------------------------------------

  /**
   * The driver's single outstanding pending offer (most recently pushed),
   * with everything the accept/decline screen needs: schools, distance,
   * trip amount, and each stop's location + time window.
   */
  async getPendingOfferForDriver(
    driverId: number,
  ): Promise<DriverPendingOffer | null> {
    const attemptRepo = this.dataSource.getRepository(RouteOfferAttemptEntity);
    const attempt = await attemptRepo.findOne({
      where: { driver_id: driverId, response: 'pending' },
      order: { pushed_at: 'DESC' },
    });
    if (!attempt) return null;

    const offer = await this.dataSource
      .getRepository(RouteOfferEntity)
      .findOne({ where: { id: attempt.route_offer_id } });
    if (!offer || offer.status !== 'pending') return null;

    const route = await this.dataSource.getRepository(RouteEntity).findOne({
      where: { id: offer.route_id },
      relations: ['stops', 'stops.student', 'carpool_school', 'bus_school'],
    });
    if (!route) return null;

    const school = route.carpool_school ?? route.bus_school;
    const candidate = offer.candidates.find((c) => c.driver_id === driverId);

    return {
      route_id: route.id,
      offer_attempt_id: attempt.id,
      kind: route.kind,
      school: school
        ? {
            id: school.id,
            name: school.name,
            latitude: Number(school.latitude),
            longitude: Number(school.longitude),
          }
        : null,
      total_distance_km: route.total_distance_km,
      trip_amount: route.trip_amount,
      distance_from_you_km: candidate?.distance_km ?? 0,
      stops: [...route.stops]
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((s) => ({
          student_id: s.student?.id ?? null,
          student_name: s.student?.name ?? 'Student',
          sequence_order: s.sequence_order,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          address_label: s.address_label,
          time_window_start: s.time_window_start,
          time_window_end: s.time_window_end,
        })),
    };
  }

  /**
   * The driver's currently active/approved route for today, for the
   * given kind. Feeds the Uber-style nav screen — ordered stops the
   * driver hasn't been offered a choice about anymore, just navigation.
   *
   * NOTE: relies on TypeORM's 'date' column comparison dropping the time
   * component of `new Date()` — double check this matches how trip_date
   * filtering works elsewhere in your codebase (e.g. isSameDay on the
   * daily_rides side does this client-side instead).
   */
  async getActiveRouteForDriver(
    driverId: number,
    kind: 'pickup' | 'dropoff',
  ): Promise<DriverActiveRoute | null> {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({
      where: {
        driver: { id: driverId } as any,
        trip_date: new Date() as any,
        kind,
        status: In(['approved', 'active']) as any,
      },
      relations: ['stops', 'stops.student', 'carpool_school', 'bus_school'],
    });
    if (!route) return null;

    const school = route.carpool_school ?? route.bus_school;

    return {
      route_id: route.id,
      kind: route.kind,
      school: school
        ? {
            name: school.name,
            latitude: Number(school.latitude),
            longitude: Number(school.longitude),
          }
        : null,
      stops: [...route.stops]
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map((s) => ({
          student_id: s.student?.id ?? null,
          student_name: s.student?.name ?? 'Student',
          sequence_order: s.sequence_order,
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          address_label: s.address_label,
          status: s.status,
        })),
    };
  }

  // ------------------------------------------------------------------
  // helpers
  // ------------------------------------------------------------------
  private async exhaustCascade(
    routeOfferId: number,
    reason: string,
  ): Promise<void> {
    const offerRepo = this.dataSource.getRepository(RouteOfferEntity);
    const offer = await offerRepo.findOne({ where: { id: routeOfferId } });
    if (!offer) return;

    await offerRepo.update(offer.id, { status: 'no_driver_found' });

    // BUG FIX — this used to write `meta: { needs_manual_driver_assignment,
    // cascade_exhausted_reason }` directly, which REPLACES route.meta
    // wholesale rather than merging into it. Any prior key on meta —
    // including flagged_reason, which the route detail page's warning
    // banner reads — got silently wiped out the moment a cascade
    // exhausted. Reading the current row first and spreading it in fixes
    // that. (Worth checking RoutesService.reject() for the same pattern —
    // it also does `meta: { flagged_reason: reason }` with no spread.)
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({ where: { id: offer.route_id } });
    await routeRepo.update(offer.route_id, {
      meta: {
        ...(route?.meta ?? {}),
        needs_manual_driver_assignment: true,
        cascade_exhausted_reason: reason,
      },
    });

    await this.notifications.sendAdminAlert({
      subject: `Route #${offer.route_id} needs manual driver assignment`,
      message: reason,
      routeId: offer.route_id,
    });
  }

  /**
   * "A driver cannot be assigned more than one pickup and dropoff per
   * day" — at most one committed route per driver per trip_date per
   * kind. Only counts routes the driver is actually committed to
   * (driver field populated via commitDriverToRoute), so a route still
   * mid-cascade never blocks anyone.
   */
  private async driverHasCommittedRouteThatDay(
    driverId: number,
    tripDate: Date,
    kind: 'pickup' | 'dropoff',
    excludeRouteId?: number,
  ): Promise<boolean> {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const count = await routeRepo.count({
      where: {
        driver: { id: driverId } as any,
        trip_date: tripDate,
        kind,
        status: Not('cancelled') as any,
        ...(excludeRouteId ? { id: Not(excludeRouteId) as any } : {}),
      },
    });
    return count > 0;
  }

  /**
   * Rule 17 — fires the parent notification once a driver is actually on
   * the route, AND now also creates the real ride/daily_ride rows for
   * every weekday in the term (per spec point 3: "the ride is created
   * automatically" on accept). Runs in one transaction so a failure
   * partway through doesn't leave the route committed with no rides, or
   * rides with no committed route.
   */
  private async commitDriverToRoute(
    routeId: number,
    driverId: number,
    vehicleId: number,
    solved: SolveResponse,
  ): Promise<RouteEntity> {
    return this.dataSource.transaction(async (manager) => {
      const routeRepo = manager.getRepository(RouteEntity);
      const route = await routeRepo.findOne({
        where: { id: routeId },
        relations: [
          'stops',
          'stops.student',
          'stops.booking_child',
          'stops.booking_child.booking',
          'stops.booking_child.booking.parent',
          'carpool_school',
          'bus_school',
        ],
      });
      if (!route) throw new NotFoundException('Route not found');

      const solvedRoute = solved.routes[0];
      await routeRepo.update(routeId, {
        driver: { id: driverId } as any,
        vehicle: { id: vehicleId } as any,
        status: 'approved',
        total_duration_minutes: solvedRoute
          ? Math.round(solvedRoute.total_duration_s / 60)
          : route.total_duration_minutes,
        total_distance_km: solvedRoute
          ? Math.round(solvedRoute.total_distance_m / 10) / 100
          : route.total_distance_km,
      });

      const driver = await manager
        .getRepository(UserEntity)
        .findOne({ where: { id: driverId } });
      const vehicle = await manager
        .getRepository(VehicleEntity)
        .findOne({ where: { id: vehicleId } });

      await this.createRidesForAcceptedRoute(manager, route, driver, vehicle);

      const bookingChildIds = route.stops
        .map((s) => s.booking_child?.id)
        .filter((id): id is number => id != null);

      // Build one notification entry per distinct parent, listing every
      // child of theirs on this route (a parent can have >1 child riding
      // the same carpool).
      const parentMap = new Map<
        number,
        { parent: UserEntity; childNames: string[] }
      >();
      for (const stop of route.stops) {
        const parent = stop.booking_child?.booking?.parent;
        if (!parent) continue;
        const entry = parentMap.get(parent.id) ?? { parent, childNames: [] };
        entry.childNames.push(stop.booking_child!.name);
        parentMap.set(parent.id, entry);
      }

      await this.notifications.sendParentDriverMatchedWhatsApp({
        bookingChildIds,
        driverId,
        routeId,
        kind: route.kind,
        driverName: driver?.firstName ?? driver?.name ?? 'your driver',
        driverPhone: driver?.phone_number ?? null,
        vehiclePlate: vehicle?.registration_number ?? null,
        parents: [...parentMap.values()].map((e) => ({
          parentId: e.parent.id,
          pushToken: e.parent.push_token ?? null,
          phoneNumber: e.parent.phone_number ?? null,
          parentFirstName: e.parent.firstName ?? e.parent.name ?? 'Parent',
          childNames: e.childNames,
        })),
      });
      return (await routeRepo.findOne({
        where: { id: routeId },
      })) as RouteEntity;
    });
  }

  /**
   * Creates or merges into a Ride+DailyRides for every student on this
   * route, scoped to what THIS accept actually knows: one direction
   * (route.kind). If the other direction was already accepted earlier,
   * finds that existing Ride (matched by student + term) and merges this
   * leg into its schedule rather than creating a duplicate Ride. If not,
   * creates a new Ride with this leg real and the other direction as an
   * explicit placeholder — patched in whenever that direction gets
   * accepted later.
   *
   * KNOWN GAP — ride.school always null. There is no foreign key path
   * from CarpoolSchoolEntity/BusSchoolEntity to SchoolEntity; they are
   * unrelated tables. Needs a migration decision from you, not a code fix.
   */
  private async createRidesForAcceptedRoute(
    manager: EntityManager,
    route: RouteEntity,
    driver: UserEntity | null,
    vehicle: VehicleEntity | null,
  ): Promise<void> {
    const studentStops = route.stops.filter(
      (s) => s.booking_child != null && s.student != null,
    );
    if (studentStops.length === 0) return;

    // CHANGED — 90 days from acceptance time, not the term's date range.
    // Same weekday-only filtering as the manual assignRide() flow.
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 90);
    const weekdays = this.getWeekdaysBetweenDates(
      today.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10),
    );
    if (weekdays.length === 0) return;

    const rideKind =
      route.kind === 'pickup' ? DailyRideKind.Pickup : DailyRideKind.Dropoff;

    const school = route.carpool_school ?? route.bus_school;
    const rideRepo = manager.getRepository(RideEntity);

    for (const stop of studentStops) {
      const bookingChild = stop.booking_child!;
      const student = stop.student!;
      const parent = bookingChild.booking?.parent ?? null;

      // Per your confirmation: pickup = home data + morning pickup time;
      // dropoff = SCHOOL data + the time they're picked up FROM school in
      // the evening. Both legs are derivable from a SINGLE accepted route
      // regardless of its own kind (see the two points above the class),
      // so the full schedule gets built the first time EITHER direction
      // is accepted — same as one assignRide() submission filling both.
      const pickupLeg = {
        start_time: bookingChild.pickup_time ?? stop.time_window_start,
        location: stop.address_label || 'Home',
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
      };
      const dropoffLeg = {
        start_time:
          route.kind === 'dropoff'
            ? (route.route_start_time ??
              bookingChild.dropoff_time ??
              '15:00:00')
            : (bookingChild.dropoff_time ?? '15:00:00'),
        location: school?.name || 'School',
        latitude: school ? Number(school.latitude) : 0,
        longitude: school ? Number(school.longitude) : 0,
      };

      let ride = await rideRepo
        .createQueryBuilder('ride')
        .where('ride.student = :studentId', { studentId: student.id })
        .andWhere(`ride.meta ->> 'term' = :term`, { term: route.term })
        .getOne();

      if (!ride) {
        const schedule: RideSchedule = {
          cost: null, // trip_amount left N/A for now
          paid: null,
          pickup: pickupLeg,
          dropoff: dropoffLeg,
          dates: weekdays,
          kind: 'Carpool',
          comments: `Auto-generated from route #${route.id}`,
        };

        ride = await rideRepo.save(
          rideRepo.create({
            vehicle: vehicle ?? null,
            driver: driver ?? null,
            school: null, // KNOWN GAP — no FK path from CarpoolSchoolEntity/
            // BusSchoolEntity to SchoolEntity, flagged earlier.
            student,
            parent,
            schedule,
            status: RideStatus.Ongoing,
            comments: `Auto-generated from route #${route.id}`,
            admin_comments: null,
            meta: {
              term: route.term,
              [`source_route_id_${route.kind}`]: route.id,
            },
          }),
        );
      } else {
        // The OTHER direction was accepted first and already created this
        // Ride with both legs. Refresh just THIS direction's leg (e.g. a
        // re-solve may have moved the time) and note this route's id.
        const mergedSchedule: RideSchedule = {
          ...(ride.schedule as RideSchedule),
          [route.kind]: route.kind === 'pickup' ? pickupLeg : dropoffLeg,
        } as RideSchedule;
        await rideRepo.update(ride.id, {
          schedule: mergedSchedule,
          meta: {
            ...(ride.meta ?? {}),
            [`source_route_id_${route.kind}`]: route.id,
          },
        });
      }

      // Always (re)build THIS direction's daily_rides from THIS route's
      // own driver/vehicle/time — authoritative for its own kind even
      // when the Ride row already existed from the other direction.
      // Delete-then-recreate keeps this idempotent if the same route is
      // ever re-solved/re-accepted (e.g. mid-term driver swap).
      await manager.getRepository(DailyRideEntity).delete({
        ride: { id: ride.id },
        kind: rideKind,
      });
      await this.saveDailyRidesForRide(
        manager,
        ride,
        vehicle,
        driver,
        rideKind,
        weekdays,
        route.kind === 'pickup' ? pickupLeg.start_time : dropoffLeg.start_time,
      );
    }
  }

  private async saveDailyRidesForRide(
    manager: EntityManager,
    ride: RideEntity,
    vehicle: VehicleEntity | null,
    driver: UserEntity | null,
    kind: DailyRideKind,
    weekdays: string[],
    startTimeStr: string,
  ): Promise<void> {
    if (!vehicle) {
      this.logger.error(
        `Cannot create daily_rides for ride #${ride.id} — no vehicle on the accepted route`,
      );
      return;
    }
    const dailyRides = weekdays.map((dateStr) => {
      const startTime = new Date(`${dateStr}T${startTimeStr}`);
      return manager.create(DailyRideEntity, {
        ride,
        vehicle,
        driver: driver ?? null,
        kind,
        date: new Date(dateStr),
        start_time: startTime,
        end_time: startTime,
        status: DailyRideStatus.Inactive,
        comments: null,
        meta: null,
        earnings_processed: false,
        // Matches the manual assignRide() flow exactly — it sets this
        // false, not true (I had it as true before; that was a mismatch).
        had_active_subscription: false,
      });
    });
    await manager.save(dailyRides);
  }

  private getTermDateRange(
    term: string,
    tripDate: string,
  ): { start: Date; end: Date } {
    const y = new Date(tripDate).getFullYear();
    switch (term) {
      case 'dec-jan':
        if (new Date(tripDate).getMonth() === 0) {
          return { start: new Date(y - 1, 11, 1), end: new Date(y, 1, 0) };
        }
        return { start: new Date(y, 11, 1), end: new Date(y + 1, 1, 0) };
      case 'apr-may':
        return { start: new Date(y, 3, 1), end: new Date(y, 5, 0) };
      case 'aug-sept':
        return { start: new Date(y, 7, 1), end: new Date(y, 9, 0) };
      default:
        return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }
  }

  private getWeekdaysBetweenDates(
    startDate: string,
    endDate: string,
  ): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return [];
    const weekdays: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6)
        weekdays.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return weekdays;
  }

  async getRankedCandidatesForRoute(routeId: number) {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({
      where: { id: routeId },
      relations: ['stops'],
    });
    if (!route || route.stops.length === 0) return [];

    const firstStop = [...route.stops].sort(
      (a, b) => a.sequence_order - b.sequence_order,
    )[0];
    const anchor = {
      lat: Number(firstStop.latitude),
      lon: Number(firstStop.longitude),
    };

    const vehicles = await this.dataSource.getRepository(VehicleEntity).find({
      where: { is_inspected: true },
      relations: ['user', 'user.kyc'],
    });

    const ranked = this.compliance
      .filterCompliant(vehicles)
      .filter((v) => v.user?.meta?.address?.home_latitude != null)
      .map((v) => ({
        driver_id: v.user!.id,
        driver_name: v.user!.name ?? v.user!.email,
        vehicle_id: v.id,
        vehicle_plate: v.registration_number,
        distance_km:
          Math.round(
            haversineKm(anchor, {
              lat: v.user!.meta!.address!.home_latitude!,
              lon: v.user!.meta!.address!.home_longitude!,
            }) * 100,
          ) / 100,
      }))
      .sort((a, b) => a.distance_km - b.distance_km);

    // Dedupe by driver — same root cause as initiateOffer's fix: this is
    // built per-VEHICLE, so a driver with more than one vehicle row (or,
    // as seen here, an outright duplicate vehicle row) appears once per
    // row. Keep only their nearest vehicle, same as the offer cascade
    // does, so the admin list and the actual offer candidates always
    // agree on "how many distinct drivers are eligible."
    const seenDrivers = new Set<number>();
    const deduped = ranked.filter((c) => {
      if (seenDrivers.has(c.driver_id)) return false;
      seenDrivers.add(c.driver_id);
      return true;
    });

    return deduped;
  }
  /**
   * Re-solves this route's existing stop set for exactly one candidate
   * driver. Returns null if infeasible for them rather than throwing, so
   * callers can treat it as "this driver doesn't work" and move on.
   */
  private async trySolveForCandidate(
    routeId: number,
    candidate: RouteOfferCandidate,
  ): Promise<{ route: RouteEntity; response: SolveResponse } | null> {
    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({
      where: { id: routeId },
      relations: [
        'stops',
        'stops.student',
        'stops.booking_child',
        'carpool_school',
      ],
    });
    if (!route) return null;

    const vehicleRepo = this.dataSource.getRepository(VehicleEntity);
    const vehicle = await vehicleRepo.findOne({
      where: { id: candidate.vehicle_id },
      relations: ['user'],
    });
    if (
      vehicle?.user?.meta?.address?.home_latitude == null ||
      vehicle.user.meta.address.home_longitude == null
    ) {
      return null;
    }

    const members: StopCandidate[] = route.stops.map((s) => ({
      bookingChildId: s.booking_child?.id ?? 0,
      studentId: s.student?.id ?? 0,
      bookingId: 0,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      schoolId: route.carpool_school?.id ?? 0,
      schoolName: route.carpool_school?.name ?? '',
      schoolLatitude: route.carpool_school
        ? Number(route.carpool_school.latitude)
        : 0,
      schoolLongitude: route.carpool_school
        ? Number(route.carpool_school.longitude)
        : 0,
      pickupTimeMinutes: this.timeToMinutes(s.time_window_start),
      dropoffTimeMinutes: this.timeToMinutes(s.time_window_end),
    }));

    const driverCandidate: DriverCandidate = {
      userId: candidate.driver_id,
      vehicleId: candidate.vehicle_id,
      homeLatitude: vehicle.user.meta.address.home_latitude!,
      homeLongitude: vehicle.user.meta.address.home_longitude!,
    };

    const cluster: CarpoolCluster = {
      members,
      schoolIds: [...new Set(members.map((m) => m.schoolId))],
      needsAdminReview: false,
    };

    try {
      const response = await this.routeSolver.solve(
        this.buildSingleDriverSolveRequest(
          cluster,
          driverCandidate,
          route.kind,
        ),
      );
      if (
        response.routes.length === 0 ||
        response.unassigned_node_ids.length > 0
      ) {
        return null;
      }
      return { route, response };
    } catch (err) {
      this.logger.warn(
        `Single-driver solve failed for candidate driver=${candidate.driver_id} route=${routeId}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private buildSingleDriverSolveRequest(
    cluster: CarpoolCluster,
    driver: DriverCandidate,
    kind: 'pickup' | 'dropoff',
  ): SolveRequest {
    const deadlineS =
      Math.min(...cluster.members.map((m) => m.pickupTimeMinutes)) * 60;
    const boardS =
      Math.max(...cluster.members.map((m) => m.dropoffTimeMinutes)) * 60;

    const schools = [
      kind === 'pickup'
        ? {
            school_id: String(cluster.members[0].schoolId),
            lat: cluster.members[0].schoolLatitude,
            lon: cluster.members[0].schoolLongitude,
            window_start_s: Math.max(0, deadlineS - PICKUP_LEAD_TIME_S),
            window_end_s: deadlineS,
          }
        : {
            school_id: String(cluster.members[0].schoolId),
            lat: cluster.members[0].schoolLatitude,
            lon: cluster.members[0].schoolLongitude,
            window_start_s: boardS,
            window_end_s: boardS + DROPOFF_BOARDING_WINDOW_S,
          },
    ];

    return {
      kind,
      time_limit_seconds: SOLVER_TIME_LIMIT_SECONDS,
      max_timing_diff_s: MAX_TIMING_DIFF_S,
      max_children_per_route: MAX_CHILDREN_PER_ROUTE,
      stops: cluster.members.map((m) => ({
        node_id: String(m.bookingChildId),
        lat: m.latitude,
        lon: m.longitude,
        school_id: String(m.schoolId),
        reference_time_s:
          kind === 'pickup'
            ? m.pickupTimeMinutes * 60
            : m.dropoffTimeMinutes * 60,
      })),
      vehicles: [
        {
          driver_id: driver.userId,
          vehicle_id: driver.vehicleId,
          shift_start_s: 5 * 3600,
          shift_end_s: 20 * 3600,
          home_lat: driver.homeLatitude,
          home_lon: driver.homeLongitude,
        },
      ],
      schools,
    };
  }

  private timeToMinutes(timeStr: string | null): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }
}
