import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, ValidateIf } from 'class-validator';
import {
  PLAN_NAME_MAX_LENGTH,
  PLAN_PRICE_MAX,
  PLAN_PRICE_MIN,
  PlanNameRules,
  PlanPriceRules,
} from './create-plan.dto.js';

// Campos opcionais: ausente (undefined) = não muda; null é valor inválido.
// Não usa PartialType porque o IsOptional dele deixaria o null passar.
const whenPresent = (_: unknown, value: unknown) => value !== undefined;

export class UpdatePlanDto {
  @ApiPropertyOptional({
    description: 'Novo nome (1 a 60 caracteres, sem espaços nas pontas).',
    example: 'Premium',
    maxLength: PLAN_NAME_MAX_LENGTH,
  })
  @ValidateIf(whenPresent)
  @PlanNameRules()
  name?: string;

  @ApiPropertyOptional({
    description: 'Novo preço em reais, com até 2 casas decimais.',
    example: 19.9,
    minimum: PLAN_PRICE_MIN,
    maximum: PLAN_PRICE_MAX,
  })
  @ValidateIf(whenPresent)
  @PlanPriceRules()
  price?: number;

  @ApiPropertyOptional({
    description: 'Plano ativo (disponível para assinar) ou inativo.',
    example: false,
  })
  @ValidateIf(whenPresent)
  @IsBoolean({ message: 'O estado ativo deve ser verdadeiro ou falso.' })
  active?: boolean;
}
