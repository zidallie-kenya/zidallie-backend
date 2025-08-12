import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { VehicleRepository } from '../vehicles.repository';
import { VehiclesRelationalRepository } from './repositories/vehicles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity])],
  providers: [
    {
      provide: VehicleRepository,
      useClass: VehiclesRelationalRepository,
    },
  ],
  exports: [VehicleRepository],
})
export class RelationalVehiclePersistenceModule {}
