import { Module } from '@nestjs/common';
import { RelationalVehiclePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UsersModule } from '../users/users.module'; // For user validation
import { VehicleController } from './vehicles.controller';
import { VehicleService } from './vehicles.service';

@Module({
  imports: [
    RelationalVehiclePersistenceModule,
    UsersModule, // For validating users in the service
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService, RelationalVehiclePersistenceModule],
})
export class VehicleModule {}
