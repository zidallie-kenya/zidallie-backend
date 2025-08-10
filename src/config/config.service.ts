import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  // ✅ Always infer types when calling ConfigService
  get<T = any>(
    key: string,
    options?: { infer: true } & Record<string, any>,
  ): T {
    return this.configService.get<T>(key, {
      infer: true,
      ...(options || {}),
    }) as T;
  }

  get redis() {
    const isProd = this.get<string>('NODE_ENV') === 'production';
    const redisUrl = isProd
      ? this.get<string>('REDIS_INTERNAL_URL')
      : this.get<string>('REDIS_EXTERNAL_URL');

    if (!redisUrl) {
      throw new Error(
        `Missing Redis URL for environment: ${isProd ? 'REDIS_INTERNAL_URL' : 'REDIS_EXTERNAL_URL'}`,
      );
    }

    const url = new URL(redisUrl);

    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,

      // Connection stability settings
      maxRetriesPerRequest: 20,
      keepAlive: 30000,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 500, 5000);
        console.log(`[Redis] Retry #${times} after ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        console.error('[Redis] Reconnect on error:', err.message);
        return true;
      },
    };
  }

  get jwt() {
    const secret = this.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return {
      secret,
      expiresIn: this.get<string>('JWT_EXPIRES_IN') || '60m',
    };
  }

  get cors() {
    return {
      origin:
        this.get<string>('NODE_ENV') === 'production'
          ? this.get<string>('ALLOWED_ORIGINS')?.split(',') || []
          : '*',
    };
  }
}
