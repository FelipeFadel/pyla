import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AllExceptionsFilter,
  type ErrorDetail,
} from './http-exception.filter.js';
import { ResponseInterceptor } from './response.interceptor.js';

function toDetails(errors: ValidationError[], prefix = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = `${prefix}${error.property}`;
    const own = Object.values(error.constraints ?? {});
    const nested = toDetails(error.children ?? [], `${field}.`);
    return own.length > 0 ? [{ field, messages: own }, ...nested] : nested;
  });
}

// Configuração global compartilhada por main.ts e pelos e2e (architecture §2.1).
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Dados inválidos.',
          details: toDetails(errors),
        }),
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: config.getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
  });
}
