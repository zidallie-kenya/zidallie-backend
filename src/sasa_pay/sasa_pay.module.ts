import { Module } from '@nestjs/common';
import { PaymentsController } from './sasa_pay.controller';
import { SasaPayService } from './sasa_pay.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [PaymentsController],
  providers: [SasaPayService],
})
export class SasaPayModule {}
