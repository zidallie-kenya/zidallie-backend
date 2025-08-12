import { Module } from '@nestjs/common';
import { RideRepository } from '../ride.repository';
import { RidesRelationalRepository } from './repositories/ride.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideEntity } from './entities/ride.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RideEntity])],
  providers: [
    {
      provide: RideRepository,
      useClass: RidesRelationalRepository,
    },
  ],
  exports: [RideRepository],
})
export class RelationalRidePersistenceModule {}
