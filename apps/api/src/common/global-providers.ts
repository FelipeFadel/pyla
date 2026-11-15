import type { Provider } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './http-exception.filter.js';
import { ResponseInterceptor } from './response.interceptor.js';
import { createValidationPipe } from './validation.pipe.js';

// Pipe, interceptor e filtro globais (architecture §2.1). Usada pelo AppModule
// e pelos e2e, para o teste exercitar a configuração real.
export const GLOBAL_PROVIDERS: Provider[] = [
  { provide: APP_PIPE, useFactory: createValidationPipe },
  { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  { provide: APP_FILTER, useClass: AllExceptionsFilter },
];
