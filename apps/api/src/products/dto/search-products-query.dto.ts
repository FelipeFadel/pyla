import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Mesmo limite do nome do produto (spec, CA13).
const SEARCH_MAX = 80;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SearchProductsQueryDto {
  @ApiProperty({
    description:
      'Parte do nome do produto, sem diferenciar maiúsculas nem acentos.',
    example: 'arroz',
    maxLength: SEARCH_MAX,
  })
  @Transform(trim)
  @IsString({ message: 'O termo de busca deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o termo de busca.' })
  @MaxLength(SEARCH_MAX, {
    message: `O termo de busca deve ter no máximo ${SEARCH_MAX} caracteres.`,
  })
  search: string;
}
