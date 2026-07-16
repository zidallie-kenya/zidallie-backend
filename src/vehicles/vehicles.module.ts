import { Module } from '@nestjs/common';
import { RelationalVehiclePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UsersModule } from '../users/users.module';
import { VehicleController } from './vehicles.controller';
import { VehicleService } from './vehicles.service';
import { KycModule } from '../kyc/kyc.module'; // ← new

@Module({
  imports: [
    RelationalVehiclePersistenceModule,
    UsersModule,
    KycModule, // ← new, brings in S3Service
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService, RelationalVehiclePersistenceModule],
})
export class VehicleModule {}
