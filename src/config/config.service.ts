import { Injectable } from '@nestjs/common';
@Injectable()
export class AppConfigService {
  get redis() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    };
  }
  get jwt() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN || '60m',
    };
  }
  get cors() {
    return {
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || []
          : '*',
    };
  }
}
