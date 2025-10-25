import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - cho phép tất cả các domain

  app.enableCors({
    origin: '*', // Cho phép tất cả các domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  });

  // Global validation pipe - more permissive
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false, // Allow all properties
    forbidNonWhitelisted: false, // Don't forbid extra properties
    transform: true,
    skipMissingProperties: true, // Skip validation for missing properties
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 29000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();