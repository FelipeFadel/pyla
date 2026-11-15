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

// Erros conhecidos do Prisma (PrismaClientKnownRequestError) traduzidos para
// 4xx com texto próprio. `meta`, valores e o texto do Prisma nunca saem.
// Código que não está aqui cai no 500 genérico e vai para o log.
const PRISMA_ERRORS: Record<string, { statusCode: number; message: string }> = {
  // Valor maior que a coluna aceita.
  P2000: { statusCode: HttpStatus.BAD_REQUEST, message: 'Dados inválidos.' },
  // Unicidade violada. 400 genérico, sem dizer qual valor repetiu
  // (US01, CA2/CA9: não revelar se o e-mail já existe).
  P2002: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Não foi possível concluir o cadastro.',
  },
  // Chave estrangeira violada: o registro relacionado não existe ou está em uso.
  P2003: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Conflito com registros relacionados.',
  },
  // Registro exigido pela operação não encontrado (update/delete sem alvo).
  P2025: { statusCode: HttpStatus.NOT_FOUND, message: 'Recurso não encontrado.' },
};

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
    const prismaError = this.knownPrismaError(exception);

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      custom = this.customPart(exception.getResponse());
    } else if (prismaError) {
      statusCode = prismaError.statusCode;
      custom = { message: prismaError.message };
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
  private knownPrismaError(
    exception: unknown,
  ): { statusCode: number; message: string } | undefined {
    if (typeof exception !== 'object' || exception === null) return undefined;
    const code = (exception as { code?: unknown }).code;
    return typeof code === 'string' && Object.hasOwn(PRISMA_ERRORS, code)
      ? PRISMA_ERRORS[code]
      : undefined;
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
