import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // No global prefix - routes start from root

  const port = process.env.PORT || 3001;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("Stripe Payment API")
    .setDescription("API documentation for Stripe coffee shop payment system")
    .setVersion("1.0")
    .addTag("payment")
    .addServer(`http://localhost:${port}`)
    .addServer("https://backend-connect-checkout.vercel.app")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  console.log("🚀 Starting Stripe Payment API...");
  console.log("🔧 Environment:", process.env.NODE_ENV || "development");
  console.log(
    "🌐 CORS enabled for:",
    process.env.FRONTEND_URL || "http://localhost:3000"
  );

  await app.listen(port);

  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 API endpoint: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
