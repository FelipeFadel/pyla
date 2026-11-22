import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PLAN_NAME_MAX_LENGTH = 60;
export const PLAN_PRICE_MIN = 0.01;
export const PLAN_PRICE_MAX = 9999.99;

// Regras de nome e preço compartilhadas por criação e edição.
export const PlanNameRules = () =>
  applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString({ message: 'O nome deve ser um texto.' }),
    IsNotEmpty({ message: 'Informe o nome do plano.' }),
    MaxLength(PLAN_NAME_MAX_LENGTH, {
      message: `O nome deve ter no máximo ${PLAN_NAME_MAX_LENGTH} caracteres.`,
    }),
  );

export const PlanPriceRules = () =>
  applyDecorators(
    IsNumber(
      { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
      { message: 'O preço deve ser um número com até 2 casas decimais.' },
    ),
    Min(PLAN_PRICE_MIN, { message: 'O preço deve ser maior que zero.' }),
    Max(PLAN_PRICE_MAX, { message: 'O preço deve ser no máximo 9999,99.' }),
  );

export class CreatePlanDto {
  @ApiProperty({
    description: 'Nome do plano (1 a 60 caracteres, sem espaços nas pontas).',
    example: 'Premium',
    maxLength: PLAN_NAME_MAX_LENGTH,
  })
  @PlanNameRules()
  name: string;

  @ApiProperty({
    description: 'Preço em reais, com até 2 casas decimais.',
    example: 19.9,
    minimum: PLAN_PRICE_MIN,
    maximum: PLAN_PRICE_MAX,
  })
  @PlanPriceRules()
  price: number;
}
