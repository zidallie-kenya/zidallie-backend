import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

const isDatabaseUrlProvided =
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

export const AppDataSource = new DataSource({
  type: process.env.DATABASE_TYPE as any,
  ...(isDatabaseUrlProvided
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
      }),
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  dropSchema: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  extra: {
    max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100', 10),
    ssl:
      process.env.DATABASE_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized:
              process.env.DATABASE_REJECT_UNAUTHORIZED === 'true',
            ca: process.env.DATABASE_CA || undefined,
            key: process.env.DATABASE_KEY || undefined,
            cert: process.env.DATABASE_CERT || undefined,
          }
        : undefined,
  },
} as DataSourceOptions);

console.log('📦 Connecting to database:');
if (isDatabaseUrlProvided) {
  console.log(` → Using DATABASE_URL: ${process.env.DATABASE_URL}`);
} else {
  console.log(` → Host: ${process.env.DATABASE_HOST}`);
  console.log(` → Port: ${process.env.DATABASE_PORT}`);
  console.log(` → Username: ${process.env.DATABASE_USERNAME}`);
  console.log(` → Database: ${process.env.DATABASE_NAME}`);
}
