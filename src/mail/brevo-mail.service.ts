import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { MailData } from './interfaces/mail-data.interface';
import { MaybeType } from '../utils/types/maybe.type';
import { AllConfigType } from '../config/config.type';
import { BrevoMailerService } from '../mailer/brevo.service';

@Injectable()
export class BrevoMailService {
  constructor(
    private readonly brevoMailerService: BrevoMailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  // async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
  //   const i18n = I18nContext.current();
  //   let emailConfirmTitle: MaybeType<string>;
  //   let text1: MaybeType<string>;
  //   let text2: MaybeType<string>;
  //   let text3: MaybeType<string>;

  //   if (i18n) {
  //     [emailConfirmTitle, text1, text2, text3] = await Promise.all([
  //       i18n.t('common.confirmEmail'),
  //       i18n.t('confirm-email.text1'),
  //       i18n.t('confirm-email.text2'),
  //       i18n.t('confirm-email.text3'),
  //     ]);
  //   }

  //   const url = new URL(
  //     this.configService.getOrThrow('app.backendDomain', { infer: true }) +
  //       '/api/v1/auth/email/confirm',
  //   );
  //   url.searchParams.set('hash', mailData.data.hash);

  //   await this.brevoMailerService.sendMail({
  //     to: mailData.to,
  //     subject: emailConfirmTitle ?? 'Confirm Your Email',
  //     htmlContent: `
  //       <h1>${emailConfirmTitle}</h1>
  //       <p>${text1}</p>
  //       <p><a href="${url.toString()}">${url.toString()}</a></p>
  //       <p>${text2}</p>
  //       <p>${text3}</p>
  //     `,
  //     textContent: `${emailConfirmTitle} - ${url.toString()}`,
  //   });
  // }

  async userSignUp(mailData: MailData<{ otp: string }>): Promise<void> {
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

    // Remove the URL block entirely, replace sendMail with:
    await this.brevoMailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle ?? 'Confirm Your Email',
      htmlContent: `
      <h1>${emailConfirmTitle ?? 'Confirm Your Email'}</h1>
      <p>${text1 ?? 'Use the code below to verify your email address.'}</p>
      <div style="margin: 24px 0; padding: 16px 32px; background: #f4f4f4; border-radius: 8px; display: inline-block;">
        <h2 style="letter-spacing: 8px; font-size: 32px; margin: 0;">${mailData.data.otp}</h2>
      </div>
      <p>${text2 ?? 'This code expires in 10 minutes.'}</p>
      <p>${text3 ?? 'If you did not create an account, ignore this email.'}</p>
    `,
      textContent: `Your verification code is: ${mailData.data.otp}. It expires in 10 minutes.`,
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

    // Deep link — opens the app directly instead of a web page
    const deepLink = `zidallieparents://password-change?hash=${mailData.data.hash}&expires=${mailData.data.tokenExpires}`;

    await this.brevoMailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle ?? 'Reset Your Password',
      htmlContent: `
      <h1>${resetPasswordTitle ?? 'Reset Your Password'}</h1>
      <p>${text1 ?? 'Trouble signing in?'}</p>
      <p>
        <a href="${deepLink}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #1a1a1a;
          color: #ffffff;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        ">Reset password</a>
      </p>
      <p>${text2 ?? 'Resetting your password is easy.'}</p>
      <p>${text3 ?? 'Just press the button above and follow the instructions.'}</p>
      <p>${text4 ?? 'If you did not make this request then please ignore this email.'}</p>
    `,
      textContent: `${resetPasswordTitle ?? 'Reset Your Password'} - ${deepLink}`,
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
