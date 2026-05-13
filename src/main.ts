import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // Debug logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    fs.appendFileSync(
      'submit_debug.log',
      `[${new Date().toISOString()}] ${req.method} ${req.url}\n`,
    );
    if (req.method !== 'GET') {
      fs.appendFileSync(
        'submit_debug.log',
        `Body: ${JSON.stringify(req.body)}\n`,
      );
    }
    next();
  });

  // Serve uploaded files as static
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Calibration API')
    .setDescription('API สำหรับระบบสอบเทียบ (Calibration)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: true, // อนุญาตทุกแหล่งที่มา
    credentials: true, // ถ้ามีระบบเก็บ cookie/session
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? '0.0.0.0');
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger UI: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
void bootstrap();
