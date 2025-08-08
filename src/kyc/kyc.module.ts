import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { RelationalKYCPersistenceModule } from './infrastructure/persistence/relational/relational-persitence.module';

const infrastructurePersistenceModule = RelationalKYCPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [infrastructurePersistenceModule],
})
export class KycModule {}
