import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { __express as hbsExpressEngine } from 'hbs';
// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { runMigrations } from './database/migrate';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    logger.log('Running database migrations...');
    try {
      await runMigrations(databaseUrl);
      logger.log('Database migrations completed');
    } catch (err) {
      logger.error(`Database migration failed: ${(err as Error).message}`);
      throw err;
    }
  } else {
    logger.warn('DATABASE_URL not set, skipping migrations');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );

  const clientDistPath = join(process.cwd(), 'dist/client');
  app.use(express.static(clientDistPath, {
    index: false,
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    },
  }));

  const uploadsDir = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '7d',
    index: false,
  }));

  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.SERVER_PORT || '3000');

  app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
  app.setViewEngine('html');
  app.engine('html', hbsExpressEngine);

  await app.listen(port, host);
  logger.log(`Server running on ${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();
