// routes/routes.module.ts
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { RelationalRoutePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RouteSolverService } from './route-solver.service';
import { RouteSolveProcessor } from './route-solve.processor';
import { ClusteringService } from './clustering.service';
import { FlaggedGroupingService } from './flagged-grouping.service';
import { FlaggedRoutesAdminService } from './flagged-routes-admin.service';
import { RouteOfferAttemptEntity } from './infrastructure/persistence/relational/entities/route-offer-attempt.entity';
import { RouteOfferEntity } from './infrastructure/persistence/relational/entities/route-offer.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ROUTE_OFFER_CASCADE_QUEUE } from './route-offer-constants';
import { DriverComplianceService } from './driver-compliance.service';
import { RouteOfferCascadeProcessor } from './route-offer-cascade.processor';
import { ROUTE_OFFER_NOTIFICATIONS } from './route-offer-notifications.port';
import { OsrmService } from './osrm.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { RouteOfferNotificationsService } from './route-offer-notifications.service';
import { RoutesController } from './routes.controller';
import { RouteOfferService } from './route-offer.service';
import { RoutesService } from './routes.service';

@Module({
  imports: [
    RelationalRoutePersistenceModule, // domain <-> DB, exports RouteRepository
    HttpModule, // for RouteSolverService's calls to the Python microservice
    BullModule.registerQueue({ name: 'route-solve' }),
    TypeOrmModule.forFeature([RouteOfferEntity, RouteOfferAttemptEntity]),
    BullModule.registerQueue({ name: ROUTE_OFFER_CASCADE_QUEUE }),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [RoutesController],
  providers: [
    RoutesService,
    RouteSolverService,
    RouteSolveProcessor,
    ClusteringService,
    FlaggedGroupingService,
    FlaggedRoutesAdminService,
    DriverComplianceService,
    OsrmService, // NEW — road-network distance for clustering's school-proximity check (rule 6)
    RouteOfferService,
    RouteOfferCascadeProcessor,

    {
      provide: ROUTE_OFFER_NOTIFICATIONS,
      useClass: RouteOfferNotificationsService,
      // once your real notifications service implements
      // RouteOfferNotifications, swap the line above for:
      // useExisting: NotificationsService,
    },
  ],
  exports: [RoutesService, RouteSolverService],
})
export class RoutesModule {}
