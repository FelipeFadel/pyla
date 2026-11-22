import { BadRequestException, PipeTransform } from '@nestjs/common';

const EMPTY_BODY_MESSAGE = 'Informe ao menos um campo para alterar.';

// Recusa corpo sem nenhum dos campos informados (architecture §2.1, ID7:
// forma da entrada é barrada antes do service). Roda depois do ValidationPipe
// global, então só enxerga campos já validados; ausente (undefined) = não veio.
export class AtLeastOneFieldPipe<T extends object>
  implements PipeTransform<T, T>
{
  constructor(private readonly fields: readonly (keyof T & string)[]) {}

  transform(value: T): T {
    if (this.fields.every((field) => value[field] === undefined)) {
      throw new BadRequestException({
        message: 'Dados inválidos.',
        details: [{ field: 'body', messages: [EMPTY_BODY_MESSAGE] }],
      });
    }
    return value;
  }
}
