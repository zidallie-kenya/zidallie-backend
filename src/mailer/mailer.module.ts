import { Module } from '@nestjs/common';
import { BrevoMailerService } from './brevo.service';

@Module({
  providers: [BrevoMailerService],
  exports: [BrevoMailerService],
})
export class MailerModule {}
