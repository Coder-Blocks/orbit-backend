import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Serves whatever LocalDiskStorageProvider writes to ./uploads back out at
  // /uploads/<file> - swap this out too if storage moves to a real cloud
  // bucket, which would serve files from its own URL instead.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // In production, set FRONTEND_URL to your deployed frontend's origin so
  // CORS isn't wide open; falls back to allow-all for local development.
  app.enableCors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : {});
  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Orbit API listening on port ${port}`);
}
bootstrap();
