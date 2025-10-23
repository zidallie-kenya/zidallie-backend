import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PendingPaymentEntity } from './entities/pending_payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SubscriptionPlanEntity } from './entities/subscription_plans.entity';
import { PaymentEntity } from '../../../../payments/infrastructure/persistence/relational/entities/payment.entity';
import { StudentEntity } from '../../../../students/infrastructure/persistence/relational/entities/student.entity';

import { PendingPaymentRepository } from './repositories/pending_payment.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionPlanRepository } from './repositories/subscriptionplan.repository'; 
import { PaymentRepository } from '../../../../payments/infrastructure/persistence/payment.repository';
import { StudentRepository } from '../../../../students/infrastructure/persistence/student.repository';
import { StudentsRelationalRepository } from '../../../../students/infrastructure/persistence/relational/repositories/students.repository';
import { PaymentsRelationalRepository } from '../../../../payments/infrastructure/persistence/relational/repositories/payment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PendingPaymentEntity,
      SubscriptionEntity,
      SubscriptionPlanEntity, 
      PaymentEntity,
      StudentEntity,
    ]),
  ],
  providers: [
    {
      provide: PendingPaymentRepository,
      useFactory: (dataSource: DataSource) => new PendingPaymentRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: SubscriptionRepository,
      useFactory: (dataSource: DataSource) => new SubscriptionRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: SubscriptionPlanRepository,  
      useFactory: (dataSource: DataSource) => new SubscriptionPlanRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: PaymentRepository,
      useClass: PaymentsRelationalRepository,
    },
    {
      provide: StudentRepository,
      useClass: StudentsRelationalRepository,
    },
  ],
  exports: [
    PendingPaymentRepository,
    SubscriptionRepository,
    SubscriptionPlanRepository, // <-- export it too
    PaymentRepository,
    StudentRepository,
  ],
})
export class RelationalSubscriptionPersistenceModule {}
