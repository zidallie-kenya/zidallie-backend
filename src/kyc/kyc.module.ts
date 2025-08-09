import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { RelationalKYCPersistenceModule } from './infrastructure/persistence/relational/relational-persitence.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';

const infrastructurePersistenceModule = RelationalKYCPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    UsersModule,
    AuthModule,
    FilesModule,
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [infrastructurePersistenceModule],
})
export class KycModule {}
