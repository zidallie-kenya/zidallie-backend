import { Injectable } from '@nestjs/common';
import { OsrmService } from './osrm.service';

const CARPOOL_PROXIMITY_KM = 3.0;
const SCHOOL_DIRECTION_KM = 10.0;
const MAX_SCHOOLS_PER_CLUSTER = 2;
export const TIME_WINDOW_TOLERANCE_MIN = 60;
const MAX_TRIP_DURATION_MIN = 60;
const DRIVER_PROXIMITY_KM = 10.0;

export interface StopCandidate {
  bookingChildId: number;
  studentId: number;
  bookingId: number;
  latitude: number;
  longitude: number;
  schoolId: number;
  schoolName: string;
  schoolLatitude: number;
  schoolLongitude: number;
  pickupTimeMinutes: number;
  dropoffTimeMinutes: number;
}

export interface DriverCandidate {
  userId: number;
  vehicleId: number;
  // seatCapacity intentionally removed — rule 6: no per-vehicle seat
  // capacity concept anywhere in this pipeline anymore. The shared,
  // adjustable per-route cap (max_children_per_route) lives on the
  // solver's SolveRequest instead.
  homeLatitude: number;
  homeLongitude: number;
}

export interface CarpoolCluster {
  members: StopCandidate[];
  schoolIds: number[];
  needsAdminReview: boolean;
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

@Injectable()
export class ClusteringService {
  constructor(private readonly osrm: OsrmService) {}

  async buildCarpoolClusters(
    candidates: StopCandidate[],
  ): Promise<CarpoolCluster[]> {
    const clusters: CarpoolCluster[] = [];

    for (const candidate of candidates) {
      const home = { lat: candidate.latitude, lon: candidate.longitude };
      let placed = false;

      for (const cluster of clusters) {
        if (cluster.needsAdminReview) continue;

        // ALL-PAIRS check — every existing member must be within 3km of
        // the candidate, not just the cluster's original anchor. An
        // anchor-only check lets two non-anchor members end up further
        // apart than the rule allows (chaining), which is what the old
        // version did. This now matches how school/timing are already
        // checked below.
        const proximityOk = cluster.members.every(
          (m) =>
            haversineKm(home, { lat: m.latitude, lon: m.longitude }) <=
            CARPOOL_PROXIMITY_KM,
        );
        if (!proximityOk) continue;

        // Rule 6 — school-to-school spread must be checked on the
        // road network, not straight-line. Awaited per candidate/cluster
        // pair; buildCarpoolClusters is async for exactly this reason and
        // is already awaited by its one caller (RouteSolveProcessor).
        const schoolCompatible = await this.isSchoolCompatible(
          cluster,
          candidate,
        );
        if (!schoolCompatible) continue;

        const timeCompatible = cluster.members.every(
          (m) =>
            Math.abs(m.pickupTimeMinutes - candidate.pickupTimeMinutes) <=
              TIME_WINDOW_TOLERANCE_MIN &&
            Math.abs(m.dropoffTimeMinutes - candidate.dropoffTimeMinutes) <=
              TIME_WINDOW_TOLERANCE_MIN,
        );
        if (!timeCompatible) continue;

        cluster.members.push(candidate);
        if (!cluster.schoolIds.includes(candidate.schoolId)) {
          cluster.schoolIds.push(candidate.schoolId);
        }
        placed = true;
        break;
      }

      if (!placed) {
        clusters.push({
          members: [candidate],
          schoolIds: [candidate.schoolId],
          needsAdminReview: false,
        });
      }
    }

    // A cluster that never grew past its original member is a student who
    // fit nowhere — flag it now so the caller can route it straight to
    // admin review instead of silently solving it as an ordinary 1-child
    // carpool.
    for (const cluster of clusters) {
      if (cluster.members.length === 1) {
        cluster.needsAdminReview = true;
      }
    }

    return clusters;
  }

  /**
   * Rule 6 — "The road-network distance should be <=10km: school A ->
   * school B." Uses OsrmService's point-to-point road distance rather
   * than haversine. This is the clustering-time pre-filter; the solver
   * (main.py) re-checks the same rule on its own OSRM matrix as the
   * authoritative gate, so a bug here fails safe — worst case a cluster
   * gets built that the solver then rejects and flags for admin review,
   * rather than silently under- or over-clustering.
   */
  private async isSchoolCompatible(
    cluster: CarpoolCluster,
    candidate: StopCandidate,
  ): Promise<boolean> {
    if (cluster.schoolIds.includes(candidate.schoolId)) return true;
    if (cluster.schoolIds.length >= MAX_SCHOOLS_PER_CLUSTER) return false;

    const candSchool = {
      lat: candidate.schoolLatitude,
      lon: candidate.schoolLongitude,
    };

    for (const m of cluster.members) {
      if (m.schoolId === candidate.schoolId) continue;
      const memberSchool = { lat: m.schoolLatitude, lon: m.schoolLongitude };
      const distanceKm = await this.osrm.roadDistanceKm(
        candSchool,
        memberSchool,
      );
      if (distanceKm > SCHOOL_DIRECTION_KM) return false;
    }
    return true;
  }

  exceedsMaxDuration(totalDurationMinutes: number): boolean {
    return totalDurationMinutes > MAX_TRIP_DURATION_MIN;
  }

  /**
   * Rule 11/12 — driver-to-route proximity, anchored on the route's FIRST
   * stop in solved order. Which member counts as "first" differs by
   * direction (rules 9/10): furthest-from-school for pickup (the route
   * starts by driving out to the furthest child, then works back toward
   * school), nearest-to-school for dropoff (the route starts at school
   * and the first drop is the closest home). This must be computed
   * per-kind — using the same anchor for both directions was the bug
   * flagged previously ("eligibleDrivers anchors on the wrong stop for
   * dropoff").
   */
  eligibleDrivers(
    cluster: CarpoolCluster,
    drivers: DriverCandidate[],
    kind: 'pickup' | 'dropoff',
  ): DriverCandidate[] {
    const anchorSchool = {
      lat: cluster.members[0].schoolLatitude,
      lon: cluster.members[0].schoolLongitude,
    };

    const anchorMember = cluster.members.reduce((best, m) => {
      const d = haversineKm(
        { lat: m.latitude, lon: m.longitude },
        anchorSchool,
      );
      const bd = haversineKm(
        { lat: best.latitude, lon: best.longitude },
        anchorSchool,
      );
      return kind === 'pickup' ? (d > bd ? m : best) : d < bd ? m : best;
    }, cluster.members[0]);

    const firstStop = {
      lat: anchorMember.latitude,
      lon: anchorMember.longitude,
    };

    return drivers.filter(
      (d) =>
        haversineKm(firstStop, { lat: d.homeLatitude, lon: d.homeLongitude }) <=
        DRIVER_PROXIMITY_KM,
    );
  }
}
