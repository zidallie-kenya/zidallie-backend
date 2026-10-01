/* eslint-disable @typescript-eslint/no-unused-vars */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Between, DataSource, In } from 'typeorm';
import { RouteSolverService } from './route-solver.service';
import {
  ClusteringService,
  DriverCandidate,
  StopCandidate,
  CarpoolCluster,
  haversineKm,
  TIME_WINDOW_TOLERANCE_MIN,
} from './clustering.service';
import { RouteEntity } from './infrastructure/persistence/relational/entities/route.entity';
import { RouteStopEntity } from './infrastructure/persistence/relational/entities/route-stop.entity';
import {
  BookingEntity,
  BookingTerm,
} from '../booking/infrastructure/persistence/relational/entities/booking.entity';
import { SolverRoute } from './route-solver.client';
import { VehicleEntity } from '../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';

export interface SolveTermJobData {
  term: BookingTerm;
  tripDate: string;
}

export interface ResolveSingleRouteJobData {
  routeId: number;
  originalRouteId: number;
}

// Rule 4 (morning): the LAST child picked up should be ~1hr before the
// earliest class-start deadline among the cluster — e.g. deadline 7:20 ->
// window ends at 7:20, opens 1hr earlier at 6:20 — giving a lead-time
// buffer against traffic. Confirmed: anchor off the EARLIEST deadline
// (Math.min), not the latest.
const PICKUP_LEAD_TIME_S = 60 * 60;

// Rule 5 (afternoon): every boarding event for a dropoff route must fall
// within this window of class-end.
const DROPOFF_BOARDING_WINDOW_S = 40 * 60;

// Rule 3 — "a driver cannot be assigned more than one pickup and dropoff
// per day". This in-memory tracking only catches duplicates within a
// single term-solve run and is NOT the authoritative enforcement — a
// driver doesn't actually get committed to a route until they accept via
// the offer cascade, possibly hours later or from a different run. The
// authoritative, DB-backed check lives in
// RouteOfferService.driverHasCommittedRouteThatDay. This set is only
// "best-effort shaping" so a single batch pass doesn't naively build two
// different clusters around the same driver.

@Processor('route-solve')
export class RouteSolveProcessor extends WorkerHost {
  private readonly logger = new Logger(RouteSolveProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly routeSolver: RouteSolverService,
    private readonly clustering: ClusteringService,
  ) {
    super();
  }

  // Jobs on this queue have two distinct shapes ('solve-term' vs
  // 'resolve-single-route') — BullMQ's WorkerHost.process() runs for every
  // job regardless of name, so this MUST branch on job.name before
  // touching job.data, or a single-route resolve gets destructured as if
  // it were {term, tripDate} and either throws or solves garbage.
  async process(
    job: Job<SolveTermJobData | ResolveSingleRouteJobData>,
  ): Promise<void> {
    if (job.name === 'resolve-single-route') {
      return this.processSingleRouteResolve(
        job as Job<ResolveSingleRouteJobData>,
      );
    }
    return this.processTermSolve(job as Job<SolveTermJobData>);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(
      `Job ${jobId} stalled — likely process restart mid-run (e.g. dev-mode file-watch reload)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempt(s): ${err.message}`,
    );
  }

  private async processTermSolve(job: Job<SolveTermJobData>): Promise<void> {
    const { term, tripDate } = job.data;
    this.logger.log(`Starting route solve for term=${term} date=${tripDate}`);

    const carpoolCandidates = await this.fetchCarpoolCandidates(term, tripDate);
    this.logger.log(
      `Found ${carpoolCandidates.length} carpool candidates for ${term} on ${tripDate}`,
    );
    if (carpoolCandidates.length === 0) {
      this.logger.warn(
        `No candidates found! Check booking statuses, date range logic, or required-field gaps logged above.`,
      );
      return;
    }

    const sortedCandidates =
      this.sortCandidatesForOptimization(carpoolCandidates);
    const drivers = await this.fetchAvailableDrivers(term);

    // Now async — school-compatibility checks go through OsrmService for
    // real road-network distance (rule 6).
    const clusters =
      await this.clustering.buildCarpoolClusters(sortedCandidates);

    const pickupSchedule = new Set<number>();
    const dropoffSchedule = new Set<number>();

    let clusterIndex = 0;
    for (const cluster of clusters) {
      clusterIndex += 1;
      await job.updateProgress(
        Math.round((clusterIndex / clusters.length) * 100),
      );

      // Student fit nowhere during clustering — per the business rule,
      // this goes straight to admin review rather than being solved as an
      // ordinary 1-child carpool.
      if (cluster.needsAdminReview) {
        for (const kind of ['pickup', 'dropoff'] as const) {
          await this.saveFlaggedRoute(
            term,
            tripDate,
            cluster,
            'Student did not fit into any cluster — admin to decide if this trip runs',
            kind,
          );
        }
        continue;
      }

      for (const kind of ['pickup', 'dropoff'] as const) {
        const schedule = kind === 'pickup' ? pickupSchedule : dropoffSchedule;

        // Rule 11/8-fix — anchor point differs by direction (furthest-
        // from-school for pickup, nearest-to-school for dropoff), so this
        // must be computed per-kind rather than once before the loop.
        const proximityEligibleDrivers = this.clustering.eligibleDrivers(
          cluster,
          drivers,
          kind,
        );

        if (proximityEligibleDrivers.length === 0) {
          await this.saveFlaggedRoute(
            term,
            tripDate,
            cluster,
            `No driver within 10km of the first ${kind} stop`,
            kind,
          );
          continue;
        }

        // Rule 3 — at most one pickup + one dropoff route per driver per
        // day. See the note above the class for why this is best-effort.
        const eligibleDrivers = proximityEligibleDrivers.filter(
          (d) => !schedule.has(d.userId),
        );

        if (eligibleDrivers.length === 0) {
          await this.saveFlaggedRoute(
            term,
            tripDate,
            cluster,
            `Every otherwise-eligible driver already has a ${kind} route today`,
            kind,
          );
          continue;
        }

        let response: Awaited<ReturnType<typeof this.routeSolver.solve>>;
        try {
          response = await this.routeSolver.solve(
            this.buildSolveRequest(cluster, eligibleDrivers, kind),
          );
        } catch (err: any) {
          const detail =
            err?.response?.data?.detail ??
            err?.message ??
            'Unknown solver error';
          this.logger.error(
            `Solve request failed for cluster (school ${cluster.members[0].schoolId}, ${kind}): ${detail}`,
          );
          await this.saveFlaggedRoute(
            term,
            tripDate,
            cluster,
            `Solve request failed (${kind}): ${detail}`,
            kind,
          );
          continue; // move on to the next kind/cluster instead of killing the whole job
        }

        const validRoutes: SolverRoute[] = [];
        for (const solvedRoute of response.routes) {
          if (
            this.clustering.exceedsMaxDuration(
              solvedRoute.total_duration_s / 60,
            )
          ) {
            this.logger.warn(
              `Vehicle ${solvedRoute.vehicle_id} solved over 60min for ${kind} ` +
                `(${(solvedRoute.total_duration_s / 60).toFixed(1)}min) — flagging its stops`,
            );
            await this.saveFlaggedRouteForNodeIds(
              term,
              tripDate,
              cluster,
              solvedRoute.stops.map((s) => s.node_id),
              `Solved route exceeds 60 minutes (${kind})`,
              kind,
            );
            continue;
          }

          // NEW — a "ghost" route: the solver assigned this vehicle one or
          // more stops but none of them are actual students. Most commonly
          // a school-only visit with no rider behind it — see solver.py's
          // added reverse-implication constraint, which should now prevent
          // this at the source. This check stays as a second line of
          // defence: discard it entirely, don't save it, and don't consume
          // this driver's daily slot for the rest of this cluster loop.
          const hasStudents = solvedRoute.stops.some(
            (s) => s.stop_type === 'student',
          );
          if (!hasStudents) {
            this.logger.warn(
              `Vehicle ${solvedRoute.vehicle_id} (driver_id=${solvedRoute.driver_id}) ` +
                `solved a route with no student stops for ${kind} — discarding, ` +
                `not saved, driver not marked busy for this run`,
            );
            continue;
          }

          validRoutes.push(solvedRoute);
          schedule.add(solvedRoute.driver_id);
        }

        if (response.unassigned_node_ids.length > 0) {
          this.logger.warn(
            `${response.unassigned_node_ids.length} stop(s) dropped by solver ` +
              `for ${kind} — flagging for admin review`,
          );
          await this.saveFlaggedRouteForNodeIds(
            term,
            tripDate,
            cluster,
            response.unassigned_node_ids,
            `Solver could not place this student in a ${kind} route ` +
              `(time-window conflict)`,
            kind,
          );
        }

        if (validRoutes.length > 0) {
          await this.saveDraftRoutes(
            term,
            tripDate,
            kind,
            cluster,
            validRoutes,
          );
        }
      }
    }

    this.logger.log(`Finished route solve for term=${term} date=${tripDate}`);
  }

  /**
   * Mid-term driver swap. Loads the draft route created by
   * RoutesService.reassignDriver (with origin_latitude/longitude already
   * set to the new driver's live GPS ping), re-solves just that route's
   * stops from the new origin, and persists the updated order/timing.
   *
   * This deliberately does NOT re-run clustering — the set of students on
   * this route was already decided; only the driver's starting point and
   * the resulting stop order/timing change. Also doesn't consult the
   * pickup/dropoff schedule sets above, nor RouteOfferService's daily-cap
   * check — per rule 16, this path is expected to run outside normal cap
   * bookkeeping since it's specifically replacing a driver who fell
   * through.
   */
  private async processSingleRouteResolve(
    job: Job<ResolveSingleRouteJobData>,
  ): Promise<void> {
    const { routeId, originalRouteId } = job.data;
    this.logger.log(
      `Resolving single route ${routeId} (was ${originalRouteId})`,
    );

    const routeRepo = this.dataSource.getRepository(RouteEntity);
    const route = await routeRepo.findOne({
      where: { id: routeId },
      relations: [
        'stops',
        'stops.student',
        'stops.booking_child',
        'driver',
        'vehicle',
        'carpool_school',
      ],
    });

    if (!route) {
      this.logger.error(`Route ${routeId} not found for single-route resolve`);
      return;
    }
    if (route.origin_latitude == null || route.origin_longitude == null) {
      this.logger.error(
        `Route ${routeId} has no origin coordinates — cannot resolve`,
      );
      return;
    }
    if (!route.driver || !route.vehicle) {
      this.logger.error(
        `Route ${routeId} missing driver/vehicle — cannot resolve`,
      );
      return;
    }

    const carpoolSchool = route.carpool_school;

    const members: StopCandidate[] = route.stops
      .filter((s) => s.booking_child)
      .map((s) => ({
        bookingChildId: s.booking_child!.id,
        studentId: s.student?.id ?? 0,
        bookingId: 0,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        schoolId: carpoolSchool?.id ?? 0,
        schoolName: carpoolSchool?.name ?? '',
        schoolLatitude: carpoolSchool ? Number(carpoolSchool.latitude) : 0,
        schoolLongitude: carpoolSchool ? Number(carpoolSchool.longitude) : 0,
        pickupTimeMinutes: this.timeToMinutes(s.time_window_start),
        dropoffTimeMinutes: this.timeToMinutes(s.time_window_end),
      }));

    if (members.length === 0) {
      this.logger.warn(
        `Route ${routeId} has no student stops — nothing to resolve`,
      );
      return;
    }
    // school coords come from the loaded relation on the original route
    if (carpoolSchool) {
      for (const m of members) {
        m.schoolLatitude = Number(carpoolSchool.latitude);
        m.schoolLongitude = Number(carpoolSchool.longitude);
      }
    }

    const cluster: CarpoolCluster = {
      members,
      schoolIds: [...new Set(members.map((m) => m.schoolId))],
      needsAdminReview: false,
    };

    const driverCandidate: DriverCandidate = {
      userId: route.driver.id,
      vehicleId: route.vehicle.id,
      homeLatitude: Number(route.origin_latitude),
      homeLongitude: Number(route.origin_longitude),
    };

    const response = await this.routeSolver.solve(
      this.buildSolveRequest(cluster, [driverCandidate], route.kind),
    );

    if (response.routes.length === 0) {
      await routeRepo.update(routeId, {
        status: 'flagged',
        meta: {
          ...(route.meta ?? {}),
          flagged_reason: 'Could not re-solve after driver reassignment',
        },
      });
      return;
    }

    await this.saveDraftRoutes(
      route.term,
      route.trip_date.toISOString().slice(0, 10),
      route.kind,
      cluster,
      response.routes,
      routeId, // update the existing draft row instead of creating a new one
    );
  }

  // --- helpers -------------------------------------------------------

  private sortCandidatesForOptimization(
    candidates: StopCandidate[],
  ): StopCandidate[] {
    return [...candidates].sort((a, b) => {
      const distA = haversineKm(
        { lat: a.latitude, lon: a.longitude },
        { lat: a.schoolLatitude, lon: a.schoolLongitude },
      );
      const distB = haversineKm(
        { lat: b.latitude, lon: b.longitude },
        { lat: b.schoolLatitude, lon: b.schoolLongitude },
      );
      if (distB !== distA) return distB - distA;
      return a.pickupTimeMinutes - b.pickupTimeMinutes;
    });
  }

  private buildSolveRequest(
    cluster: CarpoolCluster,
    eligibleDrivers: DriverCandidate[],
    kind: 'pickup' | 'dropoff',
  ) {
    const membersBySchool = new Map<number, StopCandidate[]>();
    for (const m of cluster.members) {
      const list = membersBySchool.get(m.schoolId) ?? [];
      list.push(m);
      membersBySchool.set(m.schoolId, list);
    }

    const schools = Array.from(membersBySchool.entries()).map(
      ([schoolId, members]) => {
        if (kind === 'pickup') {
          // Rule 4 — anchor off the EARLIEST class-start deadline among
          // this school's cluster members (Math.min), per confirmation.
          const deadlineMinutes = Math.min(
            ...members.map((m) => m.pickupTimeMinutes),
          );
          const deadlineS = deadlineMinutes * 60;
          return {
            school_id: String(schoolId),
            lat: members[0].schoolLatitude,
            lon: members[0].schoolLongitude,
            window_start_s: Math.max(0, deadlineS - PICKUP_LEAD_TIME_S),
            window_end_s: deadlineS,
          };
        }
        const earliestBoardMinutes = Math.max(
          ...members.map((m) => m.dropoffTimeMinutes),
        );
        const boardS = earliestBoardMinutes * 60;
        return {
          school_id: String(schoolId),
          lat: members[0].schoolLatitude,
          lon: members[0].schoolLongitude,
          window_start_s: boardS,
          window_end_s: boardS + DROPOFF_BOARDING_WINDOW_S,
        };
      },
    );

    return {
      kind,
      time_limit_seconds: this.solverTimeLimitSeconds(cluster.members.length), // Kept in sync with clustering.service's own tolerance so the
      // solver's safety-net check can never silently disagree with what
      // clustering already allowed through.
      max_timing_diff_s: TIME_WINDOW_TOLERANCE_MIN * 60,
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
      // capacity intentionally omitted — rule 6.4, no seat-capacity
      // concept anywhere in this pipeline anymore.
      vehicles: eligibleDrivers.map((d) => ({
        driver_id: d.userId,
        vehicle_id: d.vehicleId,
        shift_start_s: 5 * 3600,
        shift_end_s: 20 * 3600,
        home_lat: d.homeLatitude,
        home_lon: d.homeLongitude,
      })),
      schools,
    };
  }

  private async saveDraftRoutes(
    term: BookingTerm,
    tripDate: string,
    kind: 'pickup' | 'dropoff',
    cluster: CarpoolCluster,
    routes: SolverRoute[],
    updateRouteId?: number,
  ): Promise<void> {
    const memberByChildId = new Map(
      cluster.members.map((m) => [String(m.bookingChildId), m]),
    );

    await this.dataSource.transaction(async (manager) => {
      for (const solved of routes) {
        // Compute student-only stops FIRST, before creating anything.
        // A solved route with no real student stops (e.g. a school-only
        // "ghost" visit — see solver.py's multi-school reverse-implication
        // fix) did nothing useful and must never be saved as a draft route
        // with a driver, vehicle and totals attached to it.
        const studentStops = solved.stops.filter(
          (s) => s.stop_type === 'student',
        );

        if (studentStops.length === 0) {
          this.logger.warn(
            `saveDraftRoutes: solved route for driver_id=${solved.driver_id} ` +
              `vehicle_id=${solved.vehicle_id} (${kind}) has no student stops ` +
              `— skipping save entirely` +
              (updateRouteId
                ? ` (route #${updateRouteId} left unchanged — TODO: consider ` +
                  `flagging it instead, so a mid-term resolve that comes back ` +
                  `empty doesn't silently leave stale data on the route)`
                : ''),
          );
          continue;
        }

        const routeData = {
          term,
          service_type: 'carpool' as const,
          kind,
          trip_date: new Date(tripDate),
          driver: { id: solved.driver_id } as any,
          vehicle: { id: solved.vehicle_id } as any,
          carpool_school: { id: cluster.members[0].schoolId } as any,
          status: 'draft' as const,
          total_duration_minutes: Math.round(solved.total_duration_s / 60),
          total_distance_km: Math.round(solved.total_distance_m / 10) / 100,
          route_start_time: this.secondsToTime(solved.start_time_s),
          route_end_time: this.secondsToTime(solved.end_time_s),
        };

        const savedRoute = updateRouteId
          ? await manager.save(RouteEntity, { id: updateRouteId, ...routeData })
          : await manager.save(manager.create(RouteEntity, routeData));

        if (updateRouteId) {
          await manager.delete(RouteStopEntity, {
            route: { id: updateRouteId },
          });
        }

        const stops = studentStops
          .map((s, i) => {
            const member = memberByChildId.get(s.node_id);
            if (!member) {
              this.logger.error(
                `saveDraftRoutes: no cluster member found for student stop node_id=${s.node_id} ` +
                  `(route driver_id=${solved.driver_id}, ${kind}) — skipping this stop`,
              );
              return null;
            }
            return manager.create(RouteStopEntity, {
              route: savedRoute,
              student: { id: member.studentId } as any,
              booking_child: { id: member.bookingChildId } as any,
              sequence_order: i + 1,
              kind,
              latitude: member.latitude,
              longitude: member.longitude,
              time_window_start:
                kind === 'pickup'
                  ? this.minutesToTime(member.pickupTimeMinutes)
                  : this.minutesToTime(member.dropoffTimeMinutes),
              time_window_end:
                kind === 'pickup'
                  ? this.minutesToTime(member.pickupTimeMinutes)
                  : this.minutesToTime(member.dropoffTimeMinutes),
              estimated_arrival: new Date(
                new Date(tripDate).getTime() + s.arrival_time_s * 1000,
              ),
              distance_from_previous_m: s.distance_from_previous_m,
              duration_from_previous_s: s.duration_from_previous_s,
              status: 'pending',
            });
          })
          .filter((s): s is RouteStopEntity => s !== null);

        await manager.save(stops);
      }
    });
  }

  private async saveFlaggedRoute(
    term: BookingTerm,
    tripDate: string,
    cluster: CarpoolCluster,
    reason: string,
    kind: 'pickup' | 'dropoff' = 'pickup',
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(RouteEntity, {
        term,
        service_type: 'carpool',
        kind,
        trip_date: new Date(tripDate),
        carpool_school: { id: cluster.members[0].schoolId } as any,
        status: 'flagged',
        meta: { flagged_reason: reason },
      });

      const stops = cluster.members.map((m, i) =>
        manager.create(RouteStopEntity, {
          route: saved,
          student: { id: m.studentId } as any,
          booking_child: { id: m.bookingChildId } as any,
          sequence_order: i + 1,
          kind,
          latitude: m.latitude,
          longitude: m.longitude,
          time_window_start:
            kind === 'pickup'
              ? this.minutesToTime(m.pickupTimeMinutes)
              : this.minutesToTime(m.dropoffTimeMinutes),
          time_window_end:
            kind === 'pickup'
              ? this.minutesToTime(m.pickupTimeMinutes)
              : this.minutesToTime(m.dropoffTimeMinutes),
          status: 'pending',
        }),
      );
      await manager.save(stops);
    });
  }

  private async saveFlaggedRouteForNodeIds(
    term: BookingTerm,
    tripDate: string,
    cluster: CarpoolCluster,
    nodeIds: string[],
    reason: string,
    kind: 'pickup' | 'dropoff' = 'pickup',
  ): Promise<void> {
    const memberByChildId = new Map(
      cluster.members.map((m) => [String(m.bookingChildId), m]),
    );
    for (const nodeId of nodeIds) {
      const member = memberByChildId.get(nodeId);
      if (!member) continue;
      await this.saveFlaggedRoute(
        term,
        tripDate,
        {
          members: [member],
          schoolIds: [member.schoolId],
          needsAdminReview: true,
        },
        reason,
        kind,
      );
    }
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = Math.floor(minutes % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:00`;
  }

  private secondsToTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  private timeToMinutes(timeStr: string | null): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  private solverTimeLimitSeconds(stopCount: number): number {
    return Math.min(30, 5 + stopCount * 2);
  }

  /**
   * Rule 1 — pickup coordinates, pickup time, dropoff time, school and
   * service/designation are all required. Previously a missing home_lat/
   * home_lon/pickup_time/dropoff_time silently defaulted (coordinates to
   * 0, i.e. null island; times to midnight via timeToMinutes(null) => 0),
   * which would corrupt clustering distance/timing math without any
   * visibility. Now excluded and logged loudly instead.
   */
  private async fetchCarpoolCandidates(
    term: BookingTerm,
    tripDate: string,
  ): Promise<StopCandidate[]> {
    const bookingRepo = this.dataSource.getRepository(BookingEntity);
    const date = new Date(tripDate);
    const month = date.getMonth(); // 0-11
    let targetYear = date.getFullYear();

    if (term === 'dec-jan' && month === 0) {
      targetYear = targetYear - 1;
    }

    const bookings = await bookingRepo.find({
      where: {
        term,
        year: targetYear,
        service_type: 'carpool',
        status: In(['deposit_paid', 'completed']),
      },
      relations: ['children', 'children.student', 'carpool_school'],
    });
    this.logger.log(`Found ${bookings.length} bookings for term ${term}`);

    const missingSchool = bookings.filter((b) => b.carpool_school === null);
    if (missingSchool.length > 0) {
      this.logger.warn(
        `${missingSchool.length}/${bookings.length} bookings have carpool_school=null ` +
          `(IDs: ${missingSchool.map((b) => b.id).join(', ')}) — excluded.`,
      );
    }

    const eligible: StopCandidate[] = [];
    const skipped: string[] = [];

    for (const b of bookings) {
      if (!b.carpool_school) continue;
      for (const child of b.children) {
        if (!child.student) {
          skipped.push(
            `child ${child.id} (booking ${b.id}): no linked student`,
          );
          continue;
        }

        const reasons: string[] = [];
        if (b.home_lat == null || b.home_lon == null) {
          reasons.push('missing pickup coordinates (home_lat/home_lon)');
        }
        if (!child.pickup_time) reasons.push('missing pickup_time');
        if (!child.dropoff_time) reasons.push('missing dropoff_time');

        if (reasons.length > 0) {
          skipped.push(
            `child ${child.id} (booking ${b.id}): ${reasons.join(', ')}`,
          );
          continue;
        }

        eligible.push({
          bookingChildId: child.id,
          studentId: child.student.id,
          bookingId: b.id,
          latitude: Number(b.home_lat),
          longitude: Number(b.home_lon),
          schoolId: b.carpool_school.id,
          schoolName: b.carpool_school.name,
          schoolLatitude: Number(b.carpool_school.latitude),
          schoolLongitude: Number(b.carpool_school.longitude),
          pickupTimeMinutes: this.timeToMinutes(child.pickup_time),
          dropoffTimeMinutes: this.timeToMinutes(child.dropoff_time),
        });
      }
    }

    if (skipped.length > 0) {
      this.logger.warn(
        `Excluded ${skipped.length} booking_child row(s) from clustering due to missing ` +
          `required fields:\n  ${skipped.join('\n  ')}`,
      );
    }

    return eligible;
  }

  private async fetchAvailableDrivers(
    term: BookingTerm,
  ): Promise<DriverCandidate[]> {
    const vehicleRepo = this.dataSource.getRepository(VehicleEntity);
    const vehicles = await vehicleRepo.find({
      where: { is_inspected: true },
      relations: ['user'],
    });

    return vehicles
      .filter(
        (v) =>
          v.user !== null &&
          v.user.meta?.address?.home_latitude != null &&
          v.user.meta?.address?.home_longitude != null,
      )
      .map((v) => ({
        userId: v.user!.id,
        vehicleId: v.id,
        homeLatitude: v.user!.meta!.address!.home_latitude!,
        homeLongitude: v.user!.meta!.address!.home_longitude!,
      }));
  }

  private getTermDateRange(
    term: BookingTerm,
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
    }
  }
}
