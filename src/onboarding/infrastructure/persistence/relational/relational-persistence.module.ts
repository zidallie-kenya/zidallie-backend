import { Module } from '@nestjs/common';
import { OnboardingRepository } from '../onboarding.repository';
import { OnboardingRelationalRepository } from './repositories/onboarding.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingFormEntity } from './entities/onboarding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingFormEntity])],
  providers: [
    {
      provide: OnboardingRepository,
      useClass: OnboardingRelationalRepository,
    },
  ],
  exports: [OnboardingRepository],
})
export class RelationalOnboardingPersistenceModule {}
