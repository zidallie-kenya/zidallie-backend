// Thin wrapper over OSRM's /route service for a single point-to-point
// road-network distance. This is deliberately separate from the batch
// /table matrix built inside the Python route-solver microservice
// (osrm_client.py) — that one builds an NxN matrix for an entire cluster
// in one call as part of a full solve; this one answers a single "how far
// apart are these two schools by road" question at clustering time,
// before a cluster (and therefore a solve request) even exists yet.

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface OsrmRouteResponse {
  code: string;
  routes: { distance: number; duration: number }[];
}

@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl =
      process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
  }

  /**
   * Real road-network distance in km between two points. Falls back to
   * a conservative Infinity (i.e. "treat as incompatible") on any OSRM
   * failure, rather than silently passing a bad cluster through on a
   * straight-line guess — the solver's own OSRM-backed check is the
   * authoritative gate, so this only needs to fail safe, not perfectly.
   */
  async roadDistanceKm(
    a: { lat: number; lon: number },
    b: { lat: number; lon: number },
  ): Promise<number> {
    const coordStr = `${a.lon},${a.lat};${b.lon},${b.lat}`;
    const url = `${this.baseUrl}/route/v1/driving/${coordStr}`;
    console.log(`OSRM request: ${this.baseUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<OsrmRouteResponse>(url, {
          params: { overview: 'false' },
          timeout: 5000,
        }),
      );
      const data = response.data;
      if (data.code !== 'Ok' || data.routes.length === 0) {
        this.logger.warn(
          `OSRM route request returned code=${data.code} for ${coordStr} — treating as incompatible`,
        );
        return Infinity;
      }
      return data.routes[0].distance / 1000;
    } catch (err) {
      this.logger.error(
        `OSRM route request failed for ${coordStr}: ${(err as Error).message} — treating as incompatible`,
      );
      return Infinity;
    }
  }
}
