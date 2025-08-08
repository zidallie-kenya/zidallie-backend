// src/config/brevo.config.ts
import { registerAs } from '@nestjs/config';
import { IsString, IsEmail } from 'class-validator';
import validateConfig from '../../utils/validate-config';

class BrevoEnvValidator {
  @IsString()
  BREVO_API_KEY: string;

  @IsEmail()
  BREVO_FROM_EMAIL: string;

  @IsString()
  BREVO_FROM_NAME: string;
}

export default registerAs('mail', () => {
  validateConfig(process.env, BrevoEnvValidator);

  return {
    apiKey: process.env.BREVO_API_KEY,
    fromEmail: process.env.BREVO_FROM_EMAIL,
    fromName: process.env.BREVO_FROM_NAME,
  };
});
