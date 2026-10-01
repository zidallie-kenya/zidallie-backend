// routes/routes.controller.ts
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { FlaggedRoutesAdminService } from './flagged-routes-admin.service';
import { QueryRouteDto } from './dto/query-route.dto';
import {
  ApproveRouteDto,
  ReassignDriverDto,
  SolveDto,
} from './dto/approve-route.dto';
import {
  AssignGroupDto,
  QueryFlaggedGroupedDto,
} from './dto/flagged-group.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ManualAssignDriverDto } from './dto/route-offer.dto';
import { RouteOfferService } from './route-offer.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Admin Routes')
@Controller({
  path: 'admin/routes',
  version: '1',
})
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly flaggedRoutesAdminService: FlaggedRoutesAdminService,
    private readonly routeOfferService: RouteOfferService,
    @InjectQueue('route-solve') private readonly solveQueue: Queue, // Inject queue
  ) {}

  @Get('job/:id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.solveQueue.getJob(id);
    if (!job) throw new NotFoundException('Job not found');

    return {
      progress: job.progress,
      state: await job.getState(),
    };
  }

  // Stage 2/4-5 trigger — kicks off the background solve for a term/day.
  // Returns immediately; the admin review screen polls GET / for status='draft' rows.
  @Post('solve')
  triggerSolve(@Body() dto: SolveDto) {
    return this.routesService.triggerTermSolve(dto);
  }

  // Stage 6 — the review list, filterable by term/status/kind/service_type.
  @Get()
  findAll(@Query() query: QueryRouteDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    return this.routesService.findManyWithPagination(query, { page, limit });
  }

  @Get('flagged')
  findFlagged(@Query('term') term: string) {
    return this.routesService.findFlagged(term);
  }

  // Flagged students grouped into proximity clusters of up to 4, per
  // pickup/dropoff direction, for the admin triage view.
  @Get('flagged/grouped')
  findFlaggedGrouped(@Query() query: QueryFlaggedGroupedDto) {
    return this.flaggedRoutesAdminService.findFlaggedGrouped(
      query.term,
      query.trip_date,
    );
  }

  // Full detail (coordinates, time windows, pairwise distances) for one
  // group, identified by its member route_stop ids.
  @Get('flagged/group-detail')
  getFlaggedGroupDetail(@Query('stop_ids') stopIds: string) {
    const ids = (stopIds ?? '')
      .split(',')
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n));
    return this.flaggedRoutesAdminService.getFlaggedGroupDetail(ids);
  }

  // Admin approves a proximity group with a chosen driver/vehicle: merges
  // the flagged stops into one approved route and supersedes the
  // originals.
  @Post('flagged/assign-group')
  assignGroup(@Body() dto: AssignGroupDto) {
    return this.flaggedRoutesAdminService.assignGroupDriver(dto);
  }

  // ------------------------------------------------------------------
  // Driver-facing — MUST be declared before the ':id' route below, or
  // Nest will try to parse "offers"/"mine" as a numeric :id and 404/500.
  //
  // All four routes below read req.user.id, so all four need the JWT
  // guard actually applied — not commented out — or req.user is
  // undefined and every call either 401s (if we check first) or crashes
  // with "Cannot read properties of undefined" (if we don't).
  // ------------------------------------------------------------------

  // The driver's single outstanding pending offer (if any), with full
  // trip detail for the accept/decline screen.
  @Get('offers/mine')
  @UseGuards(AuthGuard('jwt'))
  async getMyOffer(@Req() req: any) {
    const driverId = req.user.id;
    return this.routeOfferService.getPendingOfferForDriver(driverId);
  }

  // The driver's currently active/approved route for today, for a given
  // kind ('pickup' | 'dropoff'), used to build the Uber-style nav view.
  @Get('mine/active')
  @UseGuards(AuthGuard('jwt'))
  async getMyActiveRoute(
    @Req() req: any,
    @Query('kind') kind: 'pickup' | 'dropoff',
  ) {
    const driverId = req.user.id;
    return this.routeOfferService.getActiveRouteForDriver(driverId, kind);
  }

  @Post(':id/offer/accept')
  @UseGuards(AuthGuard('jwt'))
  acceptOffer(@Param('id', ParseIntPipe) routeId: number, @Req() req: any) {
    const driverId = req.user.id;
    return this.routeOfferService.accept(routeId, driverId);
  }

  @Post(':id/offer/decline')
  @UseGuards(AuthGuard('jwt'))
  declineOffer(@Param('id', ParseIntPipe) routeId: number, @Req() req: any) {
    const driverId = req.user.id;
    return this.routeOfferService.decline(routeId, driverId);
  }

  // Admin-facing — rule 2 step 5 fallback after 24hrs, or an admin choosing
  // to short-circuit the cascade manually at any point.
  //
  // NOTE: still unguarded. These don't read req.user, so they won't
  // crash like the driver routes did — but they're also open to anyone
  // right now. Add AuthGuard('jwt') plus a real AdminGuard once one
  // exists, same as the TODO already on these lines.
  @Post(':id/offer/manual-assign')
  // @UseGuards(AuthGuard('jwt'), AdminGuard)
  manualAssignDriver(
    @Param('id', ParseIntPipe) routeId: number,
    @Body() dto: ManualAssignDriverDto,
  ) {
    return this.routeOfferService.manualAssign(
      routeId,
      dto.driver_id,
      dto.vehicle_id,
    );
  }

  // Rule 3 entry point — call this from wherever "driver removed from
  // vehicle" already happens in your admin/driver-management flow, or
  // expose it directly if that logic doesn't exist yet.
  @Post(':id/offer/driver-removed')
  // @UseGuards(AuthGuard('jwt'), AdminGuard)
  handleDriverRemoved(
    @Param('id', ParseIntPipe) routeId: number,
    @Body('reason') reason: string,
  ) {
    return this.routeOfferService.handleDriverRemoved(
      routeId,
      reason || 'Driver removed from vehicle',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.routesService.findById(id);
  }

  // Stage 6 approval — optionally with a manually reordered stop list.
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveRouteDto) {
    return this.routesService.approve(id, dto);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.routesService.reject(id, reason);
  }

  // "When a driver changes: they get the new stops from their current location"
  @Patch(':id/reassign-driver')
  reassignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReassignDriverDto,
  ) {
    return this.routesService.reassignDriver(id, dto);
  }

  @Get(':id/ranked-drivers')
  async getRankedDrivers(@Param('id', ParseIntPipe) routeId: number) {
    return this.routeOfferService.getRankedCandidatesForRoute(routeId);
  }
}
