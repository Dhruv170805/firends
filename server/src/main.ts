import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import helmet from 'helmet';
import * as compression from 'compression';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry extremely early to catch startup errors
Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new SentryInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Enterprise-Grade Robustness
  app.use(helmet());
  app.use(compression());
  
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3001', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
