import { Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { ConfigService } from '@nestjs/config';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

@Injectable()
export class BrevoMailerService {
  private brevoClient: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('mail.apiKey', { infer: true });
    SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = apiKey;
    this.brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendMail(params: SendEmailParams): Promise<void> {
    const senderEmail = this.configService.get('mail.fromEmail', {
      infer: true,
    });
    const senderName = this.configService.get('mail.fromName', { infer: true });

    console.log('[BREVO] Sending email to:', params.to);
    console.log('[BREVO] Subject:', params.subject);
    console.log('[BREVO] From:', `${senderName} <${senderEmail}>`);

    try {
      const result = await this.brevoClient.sendTransacEmail({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent ?? '',
      });

      console.log('[BREVO] Email sent successfully:', result.messageId);
    } catch (error: any) {
      console.error(
        '[BREVO] Failed to send email:',
        error?.response?.body || error.message,
      );
      throw error;
    }
  }
}
