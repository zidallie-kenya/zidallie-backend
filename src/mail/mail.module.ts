import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { MailService } from './mail.service';
import { MailerModule } from '../mailer/mailer.module';
import { BrevoMailService } from './brevo-mail.service';

@Module({
  imports: [ConfigModule, MailerModule],
  providers: [BrevoMailService],
  exports: [BrevoMailService],
})
export class MailModule {}
