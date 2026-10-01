// Calls the Python microservice's /solve endpoint. One call = one cluster,
// one direction (pickup or dropoff) — the orchestration that loops over
// every cluster for a term lives in route-solve.processor.ts, not here.
// This service only knows how to make one HTTP call correctly.

import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { SolveRequest, SolveResponse } from './route-solver.client';

@Injectable()
export class RouteSolverService {
  private readonly logger = new Logger(RouteSolverService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    // e.g. http://route-solver:8000 in Docker Compose, or the Render
    // internal URL of the Python service in production. Never hardcode —
    // this changes between environments and you don't want a redeploy of
    // NestJS just to repoint it.
    this.baseUrl = process.env.ROUTE_SOLVER_URL ?? 'http://localhost:8000';
  }

  async solve(request: SolveRequest): Promise<SolveResponse> {
    this.logger.debug(
      `Solver request: ${request.stops.length} stops, ${request.schools.length} schools.`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<SolveResponse>(`${this.baseUrl}/solve`, request, {
          // The solver's own time_limit_seconds bounds OR-Tools' search;
          // this axios timeout needs headroom on top of that for network
          // + OSRM matrix-build time, or you'll cut off a solve that was
          // about to finish successfully.
          timeout: ((request.time_limit_seconds ?? 30) + 20) * 1000,
        }),
      );
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      this.logger.error(
        `Route solver call failed: ${axiosErr.message}`,
        axiosErr.response?.data as any,
      );
      // Surfaced as 503, not 500 — this is a downstream dependency being
      // unavailable/slow, not a bug in this request's own data.
      throw new ServiceUnavailableException(
        'Route solver is currently unavailable. The term solve will retry automatically.',
      );
    }
  }

  async health(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, { timeout: 5000 }),
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
