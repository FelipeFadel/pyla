// Corpo de sucesso de POST /purchases, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../../generated/prisma/enums.js';

export class PurchaseItemProductDto {
  id: string;

  name: string;

  categoryId: string;
}

export class PurchaseItemDto {
  id: string;

  product: PurchaseItemProductDto;

  quantity: number;

  packageSize: number;

  @ApiProperty({ enum: Unit })
  unit: Unit;

  fullPriceCents: number;

  discountCents: number;

  /** Valor do item com desconto, em centavos. */
  valueCents: number;
}

export class PurchaseStoreDto {
  id: string;

  name: string;
}

export class PurchaseDto {
  id: string;

  /** Data da compra (YYYY-MM-DD). */
  date: string;

  @ApiProperty({ enum: ['DRAFT', 'CONFIRMED'] })
  status: string;

  @ApiProperty({ type: PurchaseStoreDto, nullable: true })
  store: PurchaseStoreDto | null;

  items: PurchaseItemDto[];

  /** Soma dos itens já com desconto, em centavos. */
  itemsTotalCents: number;

  /** Desconto de caixa (soma dos itens − total pago), em centavos. */
  cashDiscountCents: number;

  /** Total da compra, em centavos. */
  totalCents: number;
}

export class PurchaseEnvelopeDto {
  data: PurchaseDto;
}
