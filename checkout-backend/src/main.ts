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
      origin: true, // Cho phép tất cả origins
      credentials: true, // Cho phép credentials
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: '*', // Cho phép tất cả headers
    });

    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
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

// ⛔ Chỉ chạy local development
if (!process.env.VERCEL && !process.env.NODE_ENV?.includes('production')) {
  createApp();
}

// ✅ Vercel serverless function handler
export default async function handler(req: any, res: any) {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }

  try {
    const express = require('express')();
    const app = await createApp(express);
    const server = app.getHttpServer();

    // Handle the request
    return new Promise((resolve, reject) => {
      server.emit('request', req, res);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
