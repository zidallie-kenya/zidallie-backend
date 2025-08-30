import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // Log every request
  // app.use((req, res, next) => {
  //   console.log(`[Request] ${req.method} ${req.originalUrl}`);
  //   next();
  // });

  app.use((req, res, next) => {
    res.setTimeout(120000); // 120 seconds
    next();
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    { exclude: ['/'] },
  );

  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: { example: 'en' },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(
    `${configService.getOrThrow('app.apiPrefix', { infer: true })}/docs`,
    app,
    document,
  );

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');
  console.log(`Server running at http://192.168.100.17:${port}`);
}

void bootstrap();
