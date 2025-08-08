import { Module } from '@nestjs/common';
import { KYCRepository } from '../kyc.repository';

import { TypeOrmModule } from '@nestjs/typeorm';
import { KYCEntity } from './entities/kyc.entity';
import { KYCRelationalRepository } from './repositories/kyc.repository';

@Module({
  imports: [TypeOrmModule.forFeature([KYCEntity])],
  providers: [
    {
      provide: KYCRepository,
      useClass: KYCRelationalRepository,
    },
  ],
  exports: [KYCRepository],
})
export class RelationalKYCPersistenceModule {}
