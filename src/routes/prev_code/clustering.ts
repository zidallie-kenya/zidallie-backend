import { Injectable } from '@nestjs/common';

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
  seatCapacity: number;
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
  buildCarpoolClusters(candidates: StopCandidate[]): CarpoolCluster[] {
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

        const schoolCompatible = this.isSchoolCompatible(cluster, candidate);

        if (!schoolCompatible) continue;

        const timeCompatible = cluster.members.every(
          (m) =>
            Math.abs(m.pickupTimeMinutes - candidate.pickupTimeMinutes) <=
              TIME_WINDOW_TOLERANCE_MIN &&
            Math.abs(m.dropoffTimeMinutes - candidate.dropoffTimeMinutes) <=
              TIME_WINDOW_TOLERANCE_MIN,
        );
        if (candidate.schoolId === cluster.members[0]?.schoolId) {
          console.log(
            `candidate ${candidate.bookingChildId} vs cluster [${cluster.members.map((m) => m.bookingChildId)}]: ` +
              `proximity=${cluster.members.every((m) => haversineKm({ lat: candidate.latitude, lon: candidate.longitude }, { lat: m.latitude, lon: m.longitude }) <= CARPOOL_PROXIMITY_KM)}, ` +
              `timeCompatible=${timeCompatible}, ` +
              `pickupDiff=${cluster.members.map((m) => Math.abs(m.pickupTimeMinutes - candidate.pickupTimeMinutes))}, ` +
              `dropoffDiff=${cluster.members.map((m) => Math.abs(m.dropoffTimeMinutes - candidate.dropoffTimeMinutes))}`,
          );
        }
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
    // carpool. Previously this flag was declared but never actually set.
    for (const cluster of clusters) {
      if (cluster.members.length === 1) {
        cluster.needsAdminReview = true;
      }
    }

    return clusters;
  }

  private isSchoolCompatible(
    cluster: CarpoolCluster,
    candidate: StopCandidate,
  ): boolean {
    if (cluster.schoolIds.includes(candidate.schoolId)) return true;
    if (cluster.schoolIds.length >= MAX_SCHOOLS_PER_CLUSTER) return false;

    const candSchool = {
      lat: candidate.schoolLatitude,
      lon: candidate.schoolLongitude,
    };
    return cluster.members.every((m) => {
      if (m.schoolId === candidate.schoolId) return true;
      const memberSchool = { lat: m.schoolLatitude, lon: m.schoolLongitude };
      return haversineKm(candSchool, memberSchool) <= SCHOOL_DIRECTION_KM;
    });
  }

  exceedsMaxDuration(totalDurationMinutes: number): boolean {
    return totalDurationMinutes > MAX_TRIP_DURATION_MIN;
  }

  eligibleDrivers(
    cluster: CarpoolCluster,
    drivers: DriverCandidate[],
  ): DriverCandidate[] {
    const anchorSchool = {
      lat: cluster.members[0].schoolLatitude,
      lon: cluster.members[0].schoolLongitude,
    };

    const furthestMember = cluster.members.reduce((furthest, m) => {
      const d = haversineKm(
        { lat: m.latitude, lon: m.longitude },
        anchorSchool,
      );
      const fd = haversineKm(
        { lat: furthest.latitude, lon: furthest.longitude },
        anchorSchool,
      );
      return d > fd ? m : furthest;
    }, cluster.members[0]);

    const firstStop = {
      lat: furthestMember.latitude,
      lon: furthestMember.longitude,
    };

    return drivers.filter(
      (d) =>
        haversineKm(firstStop, { lat: d.homeLatitude, lon: d.homeLongitude }) <=
        DRIVER_PROXIMITY_KM,
    );
  }
}
