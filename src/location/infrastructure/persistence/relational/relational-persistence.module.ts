import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './entities/location.entity';
import { LocationsRelationalRepository } from './repositories/location.repository';
import { LocationRepository } from '../location.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity])],
  providers: [
    {
      provide: LocationRepository,
      useClass: LocationsRelationalRepository,
    },
  ],
  exports: [LocationRepository],
})
export class RelationalLocationPersistenceModule {}
