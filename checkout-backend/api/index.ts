import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';

// For Vercel serverless functions
let app: any;

async function bootstrap() {
  if (!app) {
    const express = require('express')();
    const adapter = new ExpressAdapter(express);
    app = await NestFactory.create(AppModule, adapter, { logger: false });

    // Enable CORS
    app.enableCors({
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: true,
    }));

    // Global prefix
    app.setGlobalPrefix('api');

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.status(200).end();
    return;
  }

  try {
    const app = await bootstrap();
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