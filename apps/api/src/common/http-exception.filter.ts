import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Item de `details` nos erros de validação: um por campo com problema.
 * `field` é o nome do campo (aninhado: "a.b"); `messages` são os textos de
 * cada regra violada naquele campo.
 */
export interface ErrorDetail {
  field: string;
  messages: string[];
}

const DEFAULTS: Record<number, { error: string; message: string }> = {
  400: { error: 'Bad Request', message: 'Requisição inválida.' },
  401: { error: 'Unauthorized', message: 'Não autenticado.' },
  403: { error: 'Forbidden', message: 'Acesso negado.' },
  404: { error: 'Not Found', message: 'Recurso não encontrado.' },
  409: { error: 'Conflict', message: 'Conflito com o estado atual.' },
  500: {
    error: 'Internal Server Error',
    message: 'Erro interno do servidor.',
  },
};

const FALLBACK = { error: 'Error', message: 'Não foi possível concluir a requisição.' };

const UNIQUE_VIOLATION_MESSAGE = 'Não foi possível concluir o cadastro.';

// Converte todo erro em { statusCode, error, message, details?, path, timestamp }.
// Stack e texto de erro desconhecido ficam só no log, nunca na resposta.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let custom: { message?: string; details?: ErrorDetail[] } = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      custom = this.customPart(exception.getResponse());
    } else if (this.isUniqueViolation(exception)) {
      // P2002: unicidade violada no banco. Resposta genérica, sem o valor
      // repetido nem o `meta` do Prisma.
      statusCode = HttpStatus.BAD_REQUEST;
      custom = { message: UNIQUE_VIOLATION_MESSAGE };
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const base = DEFAULTS[statusCode] ?? FALLBACK;
    response.status(statusCode).json({
      statusCode,
      error: base.error,
      message: custom.message ?? base.message,
      ...(custom.details ? { details: custom.details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  // Reconhece pelo `code` para o filtro não importar o Prisma Client.
  private isUniqueViolation(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      (exception as { code?: unknown }).code === 'P2002'
    );
  }

  // Só aproveita o texto das exceções que carregam mensagem própria (em
  // português). As geradas pelo Nest têm `statusCode` e usam o texto padrão.
  private customPart(body: string | object): {
    message?: string;
    details?: ErrorDetail[];
  } {
    if (typeof body === 'string') return { message: body };
    if ('statusCode' in body) return {};
    const { message, details } = body as {
      message?: unknown;
      details?: ErrorDetail[];
    };
    return {
      message: typeof message === 'string' ? message : undefined,
      details: Array.isArray(details) ? details : undefined,
    };
  }
}
