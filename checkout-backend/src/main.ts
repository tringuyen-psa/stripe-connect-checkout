import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';

// For Vercel serverless functions
let app: any;

async function createApp(express?: Express) {
  if (!app) {
    const adapter = express ? new ExpressAdapter(express) : undefined;
    app = await NestFactory.create(AppModule, adapter);

    // Enable CORS - cho phép tất cả các domain
    app.enableCors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
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

    if (!express) {
      // For local development
      const port = process.env.PORT || 29000;
      await app.listen(port);
      console.log(`Application is running on: http://localhost:${port}`);
    } else {
      // For Vercel serverless
      await app.init();
    }
  }
  return app;
}

// For local development
if (!process.env.VERCEL) {
  createApp();
}

// For Vercel serverless
export default async (req: any, res: any) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }

  const app = await createApp();
  const server = app.getHttpServer();

  // Handle the request
  return new Promise((resolve, reject) => {
    server.emit('request', req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
};