const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module.js');
const { ValidationPipe } = require('@nestjs/common');

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    // CORS configuration
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app',
      credentials: true,
    });

    // Set global prefix for API
    app.setGlobalPrefix('api');

    await app.init();
  }
  return app;
}

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    const app = await bootstrap();

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.status(200).end();
      return;
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle request
    const httpAdapter = app.getHttpAdapter();
    await httpAdapter.get(req, res);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};