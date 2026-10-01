import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import fileConfig from './files/config/file.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { KycModule } from './kyc/kyc.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { VehicleModule } from './vehicles/vehicles.module';
import { RidesModule } from './rides/rides.module';
import { DailyRidesModule } from './daily_rides/daily_rides.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import brevoConfig from './mail/config/brevo.config';

import { LocationModule } from './location/location.module';
import { SubscriptionModule } from './subscriptions/subscription.module';

import { ScheduleModule } from '@nestjs/schedule';
import { SasaPayModule } from './sasa_pay/sasa_pay.module';
import { TransportBookingModule } from './booking/booking.module';
import { RoutesModule } from './routes/routes.module';
import redisConfig from './redis/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { WebhookModule } from './webhook/webhook.module';

const infrastructureDatabaseModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options?: DataSourceOptions) => {
    if (!options) {
      throw new Error('Database options are required');
    }

    return new DataSource(options).initialize();
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        brevoConfig,
        fileConfig,
        redisConfig,
      ],
      envFilePath: ['.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const redisUrl = configService.getOrThrow('redis.url', { infer: true });
        console.log(redisUrl);
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
      inject: [ConfigService],
    }),
    // 1. Existing BullMQ Registration
    BullModule.registerQueue({
      name: 'route-solve',
    }),

    // 2. Bull Board Setup
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    // 3. Connect the specific queue
    BullBoardModule.forFeature({
      name: 'route-solve',
      adapter: BullMQAdapter,
    }),
    infrastructureDatabaseModule,
    ScheduleModule.forRoot(), // schedule module for cron jobs and other scheduled tasks

    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),

    UsersModule,
    FilesModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    KycModule,
    SchoolsModule,
    StudentsModule,
    VehicleModule,
    RidesModule,
    DailyRidesModule,
    PaymentsModule,
    NotificationsModule,
    OnboardingModule,
    LocationModule,
    SubscriptionModule,
    SasaPayModule,
    TransportBookingModule,
    RoutesModule,
    WebhookModule,
  ],
})
export class AppModule {}
