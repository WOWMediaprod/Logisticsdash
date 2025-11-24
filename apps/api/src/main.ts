import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

const LAN_ORIGIN_REGEX = /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/;
const NGROK_ORIGIN_REGEX = /^https:\/\/.*\.ngrok.*\.app$/;
const VERCEL_ORIGIN_REGEX = /^https:\/\/logisticsdash-.*\.vercel\.app$/;
const API_INTERNAL_ORIGIN = process.env.API_INTERNAL_URL;
const API_INTERNAL_WS = process.env.API_INTERNAL_WS_URL;
const API_CORS_ORIGINS = [
  'https://logisticsdash.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://localhost:3000',
  'https://localhost:3001',
  'https://localhost:3002',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace('http://', 'https://'),
  process.env.FRONTEND_URL_HTTPS,
  process.env.NEXT_PUBLIC_WEB_URL_HTTPS,
  API_INTERNAL_ORIGIN,
  API_INTERNAL_WS,
  LAN_ORIGIN_REGEX,
  NGROK_ORIGIN_REGEX,
  VERCEL_ORIGIN_REGEX,
].filter(Boolean);

async function bootstrap() {
  // HTTPS configuration for development
  let httpsOptions = {};
  const isHttps = process.env.ENABLE_HTTPS === 'true';

  if (isHttps) {
    try {
      // Use absolute paths to certificates in the project root
      const projectRoot = path.resolve(__dirname, '../../../..');
      const keyPath = path.join(projectRoot, 'certs/key.pem');
      const certPath = path.join(projectRoot, 'certs/cert.pem');

      console.log(`🔍 Looking for certificates at: ${path.dirname(keyPath)}`);

      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('📱 HTTPS certificates loaded for development');
    } catch (error) {
      console.warn('⚠️ HTTPS certificates not found, falling back to HTTP');
      console.warn(`Error: ${error.message}`);
    }
  }

  const app = await NestFactory.create(AppModule, {
    httpsOptions: isHttps && Object.keys(httpsOptions).length > 0 ? httpsOptions : undefined,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: API_CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Logistics Platform API')
      .setDescription('Production-ready logistics platform for container hires')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`✅ Logistics API running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();