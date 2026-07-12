import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { RelationalSubscriptionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { StudentsModule } from '../students/students.module';
import { PaymentsModule } from '../payments/payments.module';
import { SchoolsModule } from '../schools/schools.module';
import { SubscriptionRepository } from './infrastructure/persistence/relational/repositories/subscription.repository';
import { DailyRidesModule } from '../daily_rides/daily_rides.module';

@Module({
  imports: [
    RelationalSubscriptionPersistenceModule,
    StudentsModule,
    PaymentsModule,
    SchoolsModule,
    forwardRef(() => DailyRidesModule),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionRepository],
  exports: [SubscriptionService, SubscriptionRepository],
})
export class SubscriptionModule {}
