import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { S3Service } from './s3.service';
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
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [KycController],
  providers: [KycService, S3Service], // ← S3Service added
  exports: [infrastructurePersistenceModule, S3Service], // ← exported for VehicleModule
})
export class KycModule {}
