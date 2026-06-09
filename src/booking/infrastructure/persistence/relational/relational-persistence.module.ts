import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// --- Entities ---
import { CarpoolSchoolEntity } from './entities/carpool-school.entity';
import { BusSchoolEntity } from './entities/bus-school.entity';
import { PickupStationEntity } from './entities/pickup-station.entity';
import { PricingEntity } from './entities/pricing.entity';
import { ClusterEntity } from './entities/cluster.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingChildEntity } from './entities/booking-child.entity';
import { BookingDepositEntity } from './entities/booking-deposit.entity';

// --- Repositories ---
import { CarpoolSchoolRepository } from './repositories/carpool-school.repository';
import { BusSchoolRepository } from './repositories/bus-school.repository';
import { PickupStationRepository } from './repositories/pickup-station.repository';
import { PricingRepository } from './repositories/pricing.repository';
import { ClusterRepository } from './repositories/cluster.repository';
import { BookingRepository } from './repositories/booking.repository';
import { BookingDepositRepository } from './repositories/booking-deposit.repository';

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
    ]),
  ],
  providers: [
    {
      provide: CarpoolSchoolRepository,
      useFactory: (dataSource: DataSource) =>
        new CarpoolSchoolRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: BusSchoolRepository,
      useFactory: (dataSource: DataSource) =>
        new BusSchoolRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: PickupStationRepository,
      useFactory: (dataSource: DataSource) =>
        new PickupStationRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: PricingRepository,
      useFactory: (dataSource: DataSource) => new PricingRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: ClusterRepository,
      useFactory: (dataSource: DataSource) => new ClusterRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: BookingRepository,
      useFactory: (dataSource: DataSource) => new BookingRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: BookingDepositRepository,
      useFactory: (dataSource: DataSource) =>
        new BookingDepositRepository(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [
    CarpoolSchoolRepository,
    BusSchoolRepository,
    PickupStationRepository,
    PricingRepository,
    ClusterRepository,
    BookingRepository,
    BookingDepositRepository,
  ],
})
export class RelationalTransportBookingPersistenceModule {}
