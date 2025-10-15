import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
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

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3002;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Stripe Subscription API')
    .setDescription('API documentation for Stripe subscription management system')
    .setVersion('1.0')
    .addTag('subscriptions')
    .addTag('users')
    .addTag('plans')
    .addServer(`http://localhost:${port}`)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  console.log('🚀 Starting NestJS application...');
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 CORS enabled for:', process.env.FRONTEND_URL || 'http://localhost:3001');

  await app.listen(port);

  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 API endpoint: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();