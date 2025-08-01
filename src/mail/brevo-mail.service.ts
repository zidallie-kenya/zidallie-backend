import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import { MaybeType } from '../utils/types/maybe.type';
// import { MailerService } from '../mailer/mailer.service';
import { AllConfigType } from '../config/config.type';
import { BrevoMailerService } from '../mailer/brevo.service';

@Injectable()
export class BrevoMailService {
  constructor(
    private readonly brevoMailerService: BrevoMailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-email.text1'),
        i18n.t('confirm-email.text2'),
        i18n.t('confirm-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/confirm-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.brevoMailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle ?? 'Confirm Your Email',
      htmlContent: `
        <h1>${emailConfirmTitle}</h1>
        <p>${text1}</p>
        <p><a href="${url.toString()}">${url.toString()}</a></p>
        <p>${text2}</p>
        <p>${text3}</p>
      `,
      textContent: `${emailConfirmTitle} - ${url.toString()}`,
    });
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const i18n = I18nContext.current();
    let resetPasswordTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;
    let text4: MaybeType<string>;

    if (i18n) {
      [resetPasswordTitle, text1, text2, text3, text4] = await Promise.all([
        i18n.t('common.resetPassword'),
        i18n.t('reset-password.text1'),
        i18n.t('reset-password.text2'),
        i18n.t('reset-password.text3'),
        i18n.t('reset-password.text4'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.brevoMailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle ?? 'Reset Your Password',
      htmlContent: `
        <h1>${resetPasswordTitle}</h1>
        <p>${text1}</p>
        <p><a href="${url.toString()}">${url.toString()}</a></p>
        <p>${text2}</p>
        <p>${text3}</p>
        <p>${text4}</p>
      `,
      textContent: `${resetPasswordTitle} - ${url.toString()}`,
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const i18n = I18nContext.current();
    let emailConfirmTitle: MaybeType<string>;
    let text1: MaybeType<string>;
    let text2: MaybeType<string>;
    let text3: MaybeType<string>;

    if (i18n) {
      [emailConfirmTitle, text1, text2, text3] = await Promise.all([
        i18n.t('common.confirmEmail'),
        i18n.t('confirm-new-email.text1'),
        i18n.t('confirm-new-email.text2'),
        i18n.t('confirm-new-email.text3'),
      ]);
    }

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', { infer: true }) +
        '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.brevoMailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle ?? 'Confirm New Email',
      htmlContent: `
        <h1>${emailConfirmTitle}</h1>
        <p>${text1}</p>
        <p><a href="${url.toString()}">${url.toString()}</a></p>
        <p>${text2}</p>
        <p>${text3}</p>
      `,
      textContent: `${emailConfirmTitle} - ${url.toString()}`,
    });
  }
}
