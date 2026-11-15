import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './common/setup-app.js';
import { setupSwagger } from './common/swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useSecurityHeaders();
  configureApp(app);
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
