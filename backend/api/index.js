const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module.js');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function bootstrap() {
  app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

module.exports = async (req, res) => {
  try {
    if (!app) {
      app = await bootstrap();
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const httpAdapter = app.getHttpAdapter();
    const response = await httpAdapter.get(req, res);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
};