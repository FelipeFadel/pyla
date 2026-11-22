// Corpo de sucesso das rotas de plano, já no envelope { data } do interceptor.

export class PlanDto {
  id: string;

  name: string;

  /** Preço em reais. */
  price: number;

  active: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export class PlanEnvelopeDto {
  data: PlanDto;
}

export class PlanListEnvelopeDto {
  data: PlanDto[];
}

export class AvailablePlanDto {
  id: string;

  name: string;

  /** Preço em reais. */
  price: number;
}

export class AvailablePlanListEnvelopeDto {
  data: AvailablePlanDto[];
}
