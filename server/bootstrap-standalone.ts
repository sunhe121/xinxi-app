import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { __express as hbsExpressEngine } from 'hbs';
// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import compression from 'compression';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { runMigrations } from './database/migrate';

process.on('unhandledRejection', (reason: unknown) => {
  // eslint-disable-next-line no-console
  console.error(
    'FATAL: Unhandled promise rejection:',
    reason instanceof Error ? reason.message : String(reason),
    reason instanceof Error ? reason.stack : undefined,
  );
});

process.on('uncaughtException', (err: Error) => {
  // eslint-disable-next-line no-console
  console.error('FATAL: Uncaught exception:', err.message, err.stack);
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const startTime = Date.now();
  logger.log('Starting application...');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);

  const uploadsDir = join(process.cwd(), 'uploads');
  try {
    mkdirSync(uploadsDir, { recursive: true });
    logger.log(`Uploads directory ready at ${uploadsDir}`);
  } catch (err) {
    logger.error(`Failed to create uploads directory: ${(err as Error).message}`);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    logger.log('Running database migrations...');
    try {
      await runMigrations(databaseUrl);
      logger.log('Database migrations completed');
    } catch (err) {
      const error = err as Error;
      logger.error(`Database migration failed: ${error.message}`);
      logger.error(error.stack || '');
      throw err;
    }
  } else {
    logger.warn('DATABASE_URL not set, skipping migrations');
  }

  logger.log('Creating Nest application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    bufferLogs: true,
  });
  logger.log(`Nest app created in ${Date.now() - startTime}ms`);
  app.flushLogs();

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use(express.json({ limit: '110mb' }));
  app.use(express.urlencoded({ extended: true, limit: '110mb' }));

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
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('/index.html') || filePath.endsWith('\\index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    },
  }));

  app.use('/uploads', express.static(uploadsDir, {
    maxAge: '7d',
    index: false,
    fallthrough: true,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    },
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

bootstrap()
  .then(() => {
    const logger = new Logger('Bootstrap');
    logger.log('Application started successfully');
  })
  .catch((err: Error) => {
    // eslint-disable-next-line no-console
    console.error('FATAL: Bootstrap failed:', err.message);
    // eslint-disable-next-line no-console
    console.error(err.stack);
    // eslint-disable-next-line no-console
    console.error('Cause:', (err as { cause?: unknown }).cause);
    process.exit(1);
  });
