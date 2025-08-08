import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationEntity } from './entities/location.entity';
import { LocationService } from './location.service';
import { ParentGateway } from '../gateways/parent.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity]), AuthModule],
  providers: [LocationService, ParentGateway],
  exports: [LocationService],
})
export class LocationModule {}
