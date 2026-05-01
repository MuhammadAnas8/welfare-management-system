import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { AppLogger } from './common/logger/app-logger.service.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor.js';
import { config } from './common/config/app.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(AppLogger);

  app.useLogger(logger);
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new RequestLoggingInterceptor(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
await app.listen(config.app.port);}
bootstrap();
