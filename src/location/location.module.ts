import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationService } from './location.service';
// import { ParentGateway } from '../gateways/parent.gateway';
import { AuthModule } from '../auth/auth.module';
import { LocationEntity } from './infrastructure/persistence/relational/entities/location.entity';
import { JwtModule } from '@nestjs/jwt';
// import { RedisModule } from '../redis/redis.module';
// import { AppConfigModule } from '../config/appconfig.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    AuthModule,
    // RedisModule,
    // AppConfigModule,
  ],
  providers: [LocationService],
  exports: [LocationService, JwtModule],
})
export class LocationModule {}
