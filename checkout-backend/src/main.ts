import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific configuration for deployed environments
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:29000',
    'https://stripe-connect-checkout-fe.vercel.app',
    'https://stripe-connect-checkout.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost and local network for development
      if (origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.')) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Log the blocked origin for debugging
      console.log(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
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