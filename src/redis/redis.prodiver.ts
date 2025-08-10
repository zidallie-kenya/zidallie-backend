// src/redis/redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/config.service';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: AppConfigService) => {
    const redis = new Redis(configService.redis);

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message || error);
    });

    // Heartbeat ping
    setInterval(() => {
      redis
        .ping()
        .catch((err) => console.error('[Redis] Ping failed:', err.message));
    }, 30000);

    return redis;
  },
  inject: [AppConfigService],
};
