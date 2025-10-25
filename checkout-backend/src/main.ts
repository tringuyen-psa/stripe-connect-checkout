import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';

let app: any;

async function createApp(express?: Express) {
  if (!app) {
    const adapter = express ? new ExpressAdapter(express) : undefined;
    app = await NestFactory.create(AppModule, adapter);

    app.enableCors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    });

    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    }));

    app.setGlobalPrefix('api');

    if (!express) {
      const port = process.env.PORT || 29000;
      await app.listen(port);
      console.log(`✅ App running on: http://localhost:${port}`);
    } else {
      await app.init();
    }
  }
  return app;
}

// ⛔ Chỉ chạy local
if (!process.env.VERCEL) {
  createApp();
}

// ✅ Cho Vercel import
export default createApp;
