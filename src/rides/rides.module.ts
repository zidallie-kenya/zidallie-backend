// rides/rides.module.ts
import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RelationalRidePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UsersModule } from '../users/users.module';
import { SchoolsModule } from '../schools/schools.module';
import { StudentsModule } from '../students/students.module';
import { VehicleModule } from '../vehicles/vehicles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideEntity } from './infrastructure/persistence/relational/entities/ride.entity';

@Module({
  imports: [
    RelationalRidePersistenceModule,
    VehicleModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    TypeOrmModule.forFeature([RideEntity]),
  ],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
