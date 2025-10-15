const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module.js');

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'https://stripe-connect-checkout-nu.vercel.app',
      credentials: true,
    });

    // Set global prefix
    app.setGlobalPrefix('api');

    await app.init();
  }
  return app;
}

// Export for Vercel serverless function
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

    // Handle request through NestJS
    const httpAdapter = app.getHttpAdapter();
    await httpAdapter.get(req, res);

  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};