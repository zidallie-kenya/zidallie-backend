import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarpoolSchoolEntity } from './infrastructure/persistence/relational/entities/carpool-school.entity';
import { BusSchoolEntity } from './infrastructure/persistence/relational/entities/bus-school.entity';
import { PickupStationEntity } from './infrastructure/persistence/relational/entities/pickup-station.entity';
import { PricingEntity } from './infrastructure/persistence/relational/entities/pricing.entity';
import { ClusterEntity } from './infrastructure/persistence/relational/entities/cluster.entity';
import { BookingEntity } from './infrastructure/persistence/relational/entities/booking.entity';
import { BookingChildEntity } from './infrastructure/persistence/relational/entities/booking-child.entity';
import { BookingDepositEntity } from './infrastructure/persistence/relational/entities/booking-deposit.entity';
import { CarpoolSchoolRepository } from './infrastructure/persistence/relational/repositories/carpool-school.repository';
import { BusSchoolRepository } from './infrastructure/persistence/relational/repositories/bus-school.repository';
import { PickupStationRepository } from './infrastructure/persistence/relational/repositories/pickup-station.repository';
import { PricingRepository } from './infrastructure/persistence/relational/repositories/pricing.repository';
import { ClusterRepository } from './infrastructure/persistence/relational/repositories/cluster.repository';
import { BookingRepository } from './infrastructure/persistence/relational/repositories/booking.repository';
import { BookingDepositRepository } from './infrastructure/persistence/relational/repositories/booking-deposit.repository';
import { TransportBookingService } from './booking.service';
import { TransportBookingController } from './booking.controller';
import { RelationalTransportBookingPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarpoolSchoolEntity,
      BusSchoolEntity,
      PickupStationEntity,
      PricingEntity,
      ClusterEntity,
      BookingEntity,
      BookingChildEntity,
      BookingDepositEntity,
      RelationalTransportBookingPersistenceModule,
    ]),
    UsersModule,
  ],
  controllers: [TransportBookingController],
  providers: [
    TransportBookingService,
    CarpoolSchoolRepository,
    BusSchoolRepository,
    PickupStationRepository,
    PricingRepository,
    ClusterRepository,
    BookingRepository,
    BookingDepositRepository,
  ],
  exports: [TransportBookingService],
})
export class TransportBookingModule {}
