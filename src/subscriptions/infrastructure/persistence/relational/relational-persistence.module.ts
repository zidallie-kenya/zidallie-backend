import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// --- Entities ---
import { PendingPaymentEntity } from './entities/pending_payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SubscriptionPlanEntity } from './entities/subscription_plans.entity';
import { PaymentEntity } from '../../../../payments/infrastructure/persistence/relational/entities/payment.entity';
import { StudentEntity } from '../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { B2cMpesaTransactionEntity } from './entities/b2c_mpesa_transaction.entity';
import { PaymentTermEntity } from './entities/payment_term.entity';
import { TermCommissionEntity } from './entities/term_commission.entity';
import { StudentPaymentEntity } from './entities/student_payment.entity';
import { SchoolDisbursementEntity } from './entities/school_disbursement.entity';

// --- Repositories ---
import { PendingPaymentRepository } from './repositories/pending_payment.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionPlanRepository } from './repositories/subscriptionplan.repository';
import { PaymentRepository } from '../../../../payments/infrastructure/persistence/payment.repository';
import { StudentRepository } from '../../../../students/infrastructure/persistence/student.repository';
import { StudentsRelationalRepository } from '../../../../students/infrastructure/persistence/relational/repositories/students.repository';
import { PaymentsRelationalRepository } from '../../../../payments/infrastructure/persistence/relational/repositories/payment.repository';
import { B2cMpesaTransactionRepository } from './repositories/b2c_mpesa_transaction.repository';
import { PaymentTermRepository } from './repositories/payment_term.repository';
import { StudentPaymentRepository } from './repositories/student_payment.repository';
import { SchoolDisbursementRepository } from './repositories/school_disbursement.repository';
import { TermCommissionRepository } from './repositories/term_commisson.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PendingPaymentEntity,
      SubscriptionEntity,
      SubscriptionPlanEntity,
      PaymentEntity,
      StudentEntity,
      B2cMpesaTransactionEntity,
      PaymentTermEntity,
      TermCommissionEntity,
      StudentPaymentEntity,
      SchoolDisbursementEntity,
    ]),
  ],
  providers: [
    {
      provide: PendingPaymentRepository,
      useFactory: (dataSource: DataSource) =>
        new PendingPaymentRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: SubscriptionRepository,
      useFactory: (dataSource: DataSource) =>
        new SubscriptionRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: SubscriptionPlanRepository,
      useFactory: (dataSource: DataSource) =>
        new SubscriptionPlanRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: B2cMpesaTransactionRepository,
      useFactory: (dataSource: DataSource) =>
        new B2cMpesaTransactionRepository(dataSource),
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
    PaymentTermRepository,
    TermCommissionRepository,
    StudentPaymentRepository,
    SchoolDisbursementRepository,
  ],
  exports: [
    PendingPaymentRepository,
    SubscriptionRepository,
    SubscriptionPlanRepository,
    PaymentRepository,
    StudentRepository,
    B2cMpesaTransactionRepository,
    PaymentTermRepository,
    TermCommissionRepository,
    StudentPaymentRepository,
    SchoolDisbursementRepository,
  ],
})
export class RelationalSubscriptionPersistenceModule {}
