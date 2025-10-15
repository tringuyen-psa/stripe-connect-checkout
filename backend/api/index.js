const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ValidationPipe } = require('@nestjs/common');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    });
    await app.init();
  }

  const server = app.getHttpServer();
  return new Promise((resolve, reject) => {
    server.emit('request', req, res);
    res.on('finish', () => resolve());
    res.on('error', (err) => reject(err));
  });
};