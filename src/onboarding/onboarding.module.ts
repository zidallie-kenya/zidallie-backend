import { Module } from '@nestjs/common';
import { RelationalOnboardingPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    RelationalOnboardingPersistenceModule,
    // SchoolsModule, // Uncomment if you need to validate schools in the service
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService, RelationalOnboardingPersistenceModule],
})
export class OnboardingModule {}
