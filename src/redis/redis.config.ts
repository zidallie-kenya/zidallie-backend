import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import { RedisConfig } from './redis-config.type';
import validateConfig from '../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  REDIS_URL!: string;
}

// const env = 'production';

export default registerAs<RedisConfig>('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  // if (env === 'development') {
  //   return {
  //     url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  //   };
  // }
  console.log(`[Redis] Using Redis URL: ${process.env.REDIS_URL}`);
  return {
    url: process.env.REDIS_URL!,
  };
});
