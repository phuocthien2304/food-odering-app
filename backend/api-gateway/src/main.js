require('dotenv').config();
require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  await app.listen(process.env.GATEWAY_PORT || 3000);
  console.log(`API Gateway listening on port ${process.env.GATEWAY_PORT || 3000}`);
}

bootstrap().catch(err => console.error('Bootstrap error:', err));
