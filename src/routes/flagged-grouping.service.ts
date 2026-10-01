import { Injectable } from '@nestjs/common';
import { haversineKm } from './clustering.service';

export interface FlaggedStudent {
  routeId: number;
  routeStopId: number;
  studentId: number;
  studentName: string;
  bookingChildId: number;
  latitude: number;
  longitude: number;
  kind: 'pickup' | 'dropoff';
  timeWindowStart: string;
  timeWindowEnd: string;
  schoolId: number | null;
  schoolName: string | null;
  flaggedReason: string | null;
}

export interface FlaggedGroup {
  groupKey: string;
  members: FlaggedStudent[];
  centroid: { lat: number; lon: number };
  maxPairwiseDistanceKm: number;
}

const MAX_GROUP_SIZE = 4;

@Injectable()
export class FlaggedGroupingService {
  /**
   * Greedy nearest-neighbour grouping capped at MAX_GROUP_SIZE, grouped
   * separately per kind (pickup students shouldn't be lumped with dropoff
   * students — they're different runs). This is a *display/triage*
   * grouping only: it does not check school compatibility or time
   * windows the way ClusteringService does for a real solve, because the
   * whole point is to show the admin students the solver already
   * couldn't place, so they can judge for themselves whether to force a
   * group together.
   */
  groupByProximity(students: FlaggedStudent[]): FlaggedGroup[] {
    const groups: FlaggedGroup[] = [];

    for (const kind of ['pickup', 'dropoff'] as const) {
      const pool = students
        .filter((s) => s.kind === kind)
        .sort((a, b) => a.timeWindowStart.localeCompare(b.timeWindowStart));

      const used = new Set<number>();

      for (const seed of pool) {
        if (used.has(seed.routeStopId)) continue;

        const rest = pool
          .filter(
            (s) =>
              !used.has(s.routeStopId) && s.routeStopId !== seed.routeStopId,
          )
          .map((s) => ({
            student: s,
            distanceKm: haversineKm(
              { lat: seed.latitude, lon: seed.longitude },
              { lat: s.latitude, lon: s.longitude },
            ),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm);

        const members = [
          seed,
          ...rest.slice(0, MAX_GROUP_SIZE - 1).map((r) => r.student),
        ];
        members.forEach((m) => used.add(m.routeStopId));

        groups.push(this.buildGroup(members));
      }
    }

    return groups;
  }

  private buildGroup(members: FlaggedStudent[]): FlaggedGroup {
    const lat = members.reduce((s, m) => s + m.latitude, 0) / members.length;
    const lon = members.reduce((s, m) => s + m.longitude, 0) / members.length;

    let maxDist = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const d = haversineKm(
          { lat: members[i].latitude, lon: members[i].longitude },
          { lat: members[j].latitude, lon: members[j].longitude },
        );
        if (d > maxDist) maxDist = d;
      }
    }

    return {
      groupKey: members
        .map((m) => m.routeStopId)
        .sort((a, b) => a - b)
        .join('-'),
      members,
      centroid: { lat, lon },
      maxPairwiseDistanceKm: Math.round(maxDist * 100) / 100,
    };
  }
}
