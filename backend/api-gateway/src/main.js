require('dotenv').config();
require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const wsBroadcast = require('./ws-broadcast');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  await app.listen(process.env.GATEWAY_PORT || 3000);
  console.log(`API Gateway listening on port ${process.env.GATEWAY_PORT || 3000}`);

  // Initialize WebSocket server attached to the same HTTP server
  try {
    const server = app.getHttpServer();
    wsBroadcast.init(server);
    console.log('WebSocket server initialized on API Gateway');
  } catch (e) {
    console.warn('Failed to initialize WebSocket server:', e.message || e);
  }
}

bootstrap().catch(err => console.error('Bootstrap error:', err));
