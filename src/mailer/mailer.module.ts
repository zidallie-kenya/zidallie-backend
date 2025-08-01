import { Module } from '@nestjs/common';
import { BrevoMailerService } from './brevo.service';
// import { MailerService } from './mailer.service';

@Module({
  providers: [BrevoMailerService],
  exports: [BrevoMailerService],
})
export class MailerModule {}
