import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import type { ErrorDetail } from './http-exception.filter.js';

function toDetails(errors: ValidationError[], prefix = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = `${prefix}${error.property}`;
    const own = Object.values(error.constraints ?? {});
    const nested = toDetails(error.children ?? [], `${field}.`);
    return own.length > 0 ? [{ field, messages: own }, ...nested] : nested;
  });
}

// ValidationPipe global (architecture §2.1, ID7), registrado como APP_PIPE.
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        message: 'Dados inválidos.',
        details: toDetails(errors),
      }),
  });
}
