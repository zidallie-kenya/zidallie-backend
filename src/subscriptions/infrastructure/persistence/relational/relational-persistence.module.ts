import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PendingPaymentEntity } from './entities/pending_payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { PaymentEntity } from '../../../../payments/infrastructure/persistence/relational/entities/payment.entity';
import { StudentEntity } from '../../../../students/infrastructure/persistence/relational/entities/student.entity';

import { PendingPaymentRepository } from './repositories/pending_payment.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { PaymentRepository } from '../../../../payments/infrastructure/persistence/payment.repository';
import { StudentRepository } from '../../../../students/infrastructure/persistence/student.repository';
import { StudentsRelationalRepository } from '../../../../students/infrastructure/persistence/relational/repositories/students.repository';
import { PaymentsRelationalRepository } from '../../../../payments/infrastructure/persistence/relational/repositories/payment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PendingPaymentEntity,
      SubscriptionEntity,
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
    // bind abstract PaymentRepository to concrete PaymentsRelationalRepository
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
    PaymentRepository,
    StudentRepository,
  ],
})
export class RelationalSubscriptionPersistenceModule {}
