import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Serve static files for temporary media (Instagram requires public HTTPS URLs)
  app.useStaticAssets(join(process.cwd(), 'temp-media'), {
    prefix: '/temp-media/',
  });
  
  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);
  
  // CORS configuration
  const corsOrigin = configService.get('CORS_ORIGIN');
  const origins = corsOrigin ? corsOrigin.split(',').map((origin: string) => origin.trim()) : [];
  
  app.enableCors({
    origin: origins,
    credentials: configService.get('CORS_CREDENTIALS') === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
