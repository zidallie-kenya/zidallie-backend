import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsRelationalRepository } from './repositories/payment.repository';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentRepository } from '../payment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  providers: [
    {
      provide: PaymentRepository,
      useClass: PaymentsRelationalRepository,
    },
  ],
  exports: [PaymentRepository],
})
export class RelationalPaymentPersistenceModule {}
