import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/config.service';

export const RedisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: AppConfigService) => {
    const redisConfig = configService.redis;
    const redis = new Redis(redisConfig);

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    return redis;
  },
  inject: [AppConfigService],
};
