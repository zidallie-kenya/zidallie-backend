// daily_rides/daily_rides.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DailyRidesService } from './daily_rides.service';
import { DailyRidesController } from './daily_rides.controller';
import { RidesModule } from '../rides/rides.module';
import { UsersModule } from '../users/users.module';
import { VehicleModule } from '../vehicles/vehicles.module';
import { RelationalDailyRidePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ExpoPushService } from './expopush.service';
import { LocationModule } from '../location/location.module';
import { SubscriptionModule } from '../subscriptions/subscription.module';
import { NotificationRepository } from '../notifications/infrastructure/persistence/notification.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../notifications/infrastructure/persistence/relational/entities/notification.entity';
import { NotificationsRelationalRepository } from '../notifications/infrastructure/persistence/relational/repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    RelationalDailyRidePersistenceModule,
    RidesModule,
    VehicleModule,
    UsersModule,
    SubscriptionModule,
    forwardRef(() => LocationModule),
    UsersModule,
  ],
  controllers: [DailyRidesController],
  providers: [
    DailyRidesService,
    ExpoPushService,
    {
      provide: NotificationRepository,
      useClass: NotificationsRelationalRepository,
    },
    ExpoPushService,
  ],
  exports: [DailyRidesService],
})
export class DailyRidesModule {}
