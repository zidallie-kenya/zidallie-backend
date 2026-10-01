// routes/infrastructure/persistence/relational/relational-persistence.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteRepository } from '../route.repository';
import { RouteRelationalRepository } from './repositories/route.repository';
import { RouteStopEntity } from './entities/route-stop.entity';
import { RouteEntity } from './entities/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteEntity, RouteStopEntity])],
  providers: [
    {
      provide: RouteRepository, // service code depends on this abstract token, never on RouteRelationalRepository directly — swappable for a different persistence layer later without touching the service
      useClass: RouteRelationalRepository,
    },
  ],
  exports: [RouteRepository],
})
export class RelationalRoutePersistenceModule {}
