import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set global prefix for API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;

  console.log('🚀 Starting Stripe Payment API...');
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 CORS enabled for:', process.env.FRONTEND_URL || 'http://localhost:3000');

  await app.listen(port);

  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 API endpoint: http://localhost:${port}`);
}

bootstrap();