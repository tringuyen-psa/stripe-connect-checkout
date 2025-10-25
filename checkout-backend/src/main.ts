import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all domains
  app.enableCors({
    origin: '*',
    credentials: true,
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