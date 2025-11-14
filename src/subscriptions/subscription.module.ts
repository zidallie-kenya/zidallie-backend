import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { RelationalSubscriptionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { StudentsModule } from '../students/students.module';
import { PaymentsModule } from '../payments/payments.module';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [
    RelationalSubscriptionPersistenceModule,
    StudentsModule,
    PaymentsModule,
    SchoolsModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
