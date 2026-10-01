import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { RouteEntity } from './infrastructure/persistence/relational/entities/route.entity';
import { RouteStopEntity } from './infrastructure/persistence/relational/entities/route-stop.entity';
import { haversineKm } from './clustering.service';
import {
  FlaggedGroup,
  FlaggedGroupingService,
  FlaggedStudent,
} from './flagged-grouping.service';
import { AssignGroupDto } from './dto/flagged-group.dto';

export interface FlaggedGroupDetail {
  members: FlaggedStudent[];
  distances: { a: number; b: number; distance_km: number }[];
}

@Injectable()
export class FlaggedRoutesAdminService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly grouping: FlaggedGroupingService,
  ) {}

  async findFlaggedGrouped(
    term: string,
    tripDate?: string,
  ): Promise<FlaggedGroup[]> {
    const students = await this.loadFlaggedStudents(term, tripDate);
    return this.grouping.groupByProximity(students);
  }

  async getFlaggedGroupDetail(stopIds: number[]): Promise<FlaggedGroupDetail> {
    if (stopIds.length === 0) {
      throw new BadRequestException('No stop_ids provided');
    }

    const stops = await this.dataSource.getRepository(RouteStopEntity).find({
      where: { id: In(stopIds) },
      relations: ['student', 'route', 'route.carpool_school'],
    });
    if (stops.length === 0) {
      throw new NotFoundException('No flagged stops found for those ids');
    }

    const members: FlaggedStudent[] = stops.map((s) =>
      this.toFlaggedStudent(s),
    );

    const distances: { a: number; b: number; distance_km: number }[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        distances.push({
          a: members[i].routeStopId,
          b: members[j].routeStopId,
          distance_km:
            Math.round(
              haversineKm(
                { lat: members[i].latitude, lon: members[i].longitude },
                { lat: members[j].latitude, lon: members[j].longitude },
              ) * 100,
            ) / 100,
        });
      }
    }

    return { members, distances };
  }

  /**
   * Merges a set of flagged (single-student) route rows into one real
   * route with the given driver/vehicle, marks the originals as
   * superseded, and returns the new route. This is intentionally NOT
   * solver-verified — the admin already reviewed the map, times and
   * distances before approving the group, which is why the route goes
   * straight to 'approved' rather than 'draft'.
   */
  async assignGroupDriver(dto: AssignGroupDto): Promise<RouteEntity> {
    const stopRepo = this.dataSource.getRepository(RouteStopEntity);

    const stops = await stopRepo.find({
      where: { id: In(dto.stop_ids) },
      relations: ['student', 'booking_child', 'route', 'route.carpool_school'],
    });

    if (stops.length !== dto.stop_ids.length) {
      throw new NotFoundException(
        'One or more flagged stops could not be found',
      );
    }

    const notFlagged = stops.filter((s) => s.route.status !== 'flagged');
    if (notFlagged.length > 0) {
      throw new BadRequestException(
        `Stop(s) ${notFlagged
          .map((s) => s.id)
          .join(', ')} belong to a route that is no longer flagged`,
      );
    }

    const kinds = new Set(stops.map((s) => s.kind));
    if (kinds.size > 1) {
      throw new BadRequestException(
        'Cannot mix pickup and dropoff students in one group',
      );
    }

    const kind = stops[0].kind as 'pickup' | 'dropoff';
    const term = stops[0].route.term;
    const tripDate = stops[0].route.trip_date;
    const carpoolSchoolId = stops[0].route.carpool_school?.id ?? null;

    // Rough admin-forced ordering (nearest-neighbour walk), not a solver
    // result — fine, since the admin is approving this by hand.
    const ordered = this.nearestNeighbourOrder(stops);

    let totalDistanceM = 0;
    for (let i = 1; i < ordered.length; i++) {
      totalDistanceM +=
        haversineKm(
          {
            lat: Number(ordered[i - 1].latitude),
            lon: Number(ordered[i - 1].longitude),
          },
          {
            lat: Number(ordered[i].latitude),
            lon: Number(ordered[i].longitude),
          },
        ) * 1000;
    }

    return this.dataSource.transaction(async (manager) => {
      const newRoute = await manager.save(
        manager.create(RouteEntity, {
          term,
          service_type: 'carpool',
          kind,
          trip_date: tripDate,
          driver: { id: dto.driver_id } as any,
          vehicle: { id: dto.vehicle_id } as any,
          carpool_school: carpoolSchoolId
            ? ({ id: carpoolSchoolId } as any)
            : undefined,
          status: 'approved',
          total_distance_km: Math.round(totalDistanceM / 10) / 100,
          total_duration_minutes: null,
          route_start_time: ordered[0].time_window_start,
          route_end_time: ordered[ordered.length - 1].time_window_end,
          meta: {
            admin_grouped: true,
            source_flagged_route_ids: [
              ...new Set(stops.map((s) => s.route.id)),
            ],
          } as any,
        }),
      );

      const newStops = ordered.map((s, i) =>
        manager.create(RouteStopEntity, {
          route: newRoute,
          student: s.student,
          booking_child: s.booking_child,
          sequence_order: i + 1,
          kind,
          latitude: s.latitude,
          longitude: s.longitude,
          time_window_start: s.time_window_start,
          time_window_end: s.time_window_end,
          status: 'pending',
        }),
      );
      await manager.save(newStops);

      const originalRouteIds = [...new Set(stops.map((s) => s.route.id))];
      await manager.update(
        RouteEntity,
        { id: In(originalRouteIds) },
        {
          status: 'cancelled',
          meta: {
            flagged_reason: 'Superseded by manual admin grouping',
            superseded_by_route_id: newRoute.id,
          } as any,
        },
      );

      return newRoute;
    });
  }

  private nearestNeighbourOrder(stops: RouteStopEntity[]): RouteStopEntity[] {
    const remaining = [...stops];
    const ordered: RouteStopEntity[] = [remaining.shift()!];
    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      remaining.sort(
        (a, b) =>
          haversineKm(
            { lat: Number(last.latitude), lon: Number(last.longitude) },
            { lat: Number(a.latitude), lon: Number(a.longitude) },
          ) -
          haversineKm(
            { lat: Number(last.latitude), lon: Number(last.longitude) },
            { lat: Number(b.latitude), lon: Number(b.longitude) },
          ),
      );
      ordered.push(remaining.shift()!);
    }
    return ordered;
  }

  private toFlaggedStudent(s: RouteStopEntity): FlaggedStudent {
    return {
      routeId: s.route.id,
      routeStopId: s.id,
      studentId: s.student?.id ?? 0,
      studentName: s.student?.name ?? 'Unknown student',
      bookingChildId: 0,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      kind: s.kind as 'pickup' | 'dropoff',
      timeWindowStart: s.time_window_start,
      timeWindowEnd: s.time_window_end,
      schoolId: s.route.carpool_school?.id ?? null,
      schoolName: s.route.carpool_school?.name ?? null,
      flaggedReason: (s.route.meta as any)?.flagged_reason ?? null,
    };
  }

  private async loadFlaggedStudents(
    term: string,
    tripDate?: string,
  ): Promise<FlaggedStudent[]> {
    const qb = this.dataSource
      .getRepository(RouteStopEntity)
      .createQueryBuilder('rs')
      .innerJoinAndSelect('rs.route', 'route')
      .leftJoinAndSelect('rs.student', 'student')
      .leftJoinAndSelect('route.carpool_school', 'school')
      .where('route.status = :status', { status: 'flagged' })
      .andWhere('route.term = :term', { term });

    if (tripDate) {
      qb.andWhere('route.trip_date = :tripDate', { tripDate });
    }

    const stops = await qb.getMany();
    return stops.map((s) => this.toFlaggedStudent(s));
  }
}
