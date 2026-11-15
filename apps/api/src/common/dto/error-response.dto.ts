// Formato de erro do AllExceptionsFilter (architecture §2.1), para o Swagger.
// As propriedades são anotadas pelo plugin do @nestjs/swagger.

export class ErrorDetailDto {
  /** Nome do campo (aninhado: "a.b"). */
  field: string;

  /** Texto de cada regra violada naquele campo. */
  messages: string[];
}

export class ErrorResponseDto {
  statusCode: number;

  error: string;

  /** Mensagem em português. */
  message: string;

  /** Só nos erros de validação: um item por campo com problema. */
  details?: ErrorDetailDto[];

  path: string;

  timestamp: string;
}
