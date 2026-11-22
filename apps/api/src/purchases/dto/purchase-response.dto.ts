// Corpo de sucesso de POST /purchases, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';
import { Unit } from '../../generated/prisma/enums.js';

export class PurchaseItemCategoryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Mercearia' })
  name: string;
}

export class PurchaseItemProductDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Arroz Branco' })
  name: string;

  @ApiProperty({ type: String, format: 'uuid' })
  categoryId: string;

  @ApiProperty({ type: PurchaseItemCategoryDto })
  category: PurchaseItemCategoryDto;
}

export class PurchaseItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: PurchaseItemProductDto })
  product: PurchaseItemProductDto;

  @ApiProperty({ type: Number, example: 2 })
  quantity: number;

  @ApiProperty({ type: Number, example: 5 })
  packageSize: number;

  @ApiProperty({ enum: Unit })
  unit: Unit;

  @ApiProperty({ type: Number, description: 'Preço cheio, em centavos.' })
  fullPriceCents: number;

  @ApiProperty({ type: Number, description: 'Desconto do item, em centavos.' })
  discountCents: number;

  /** Valor do item com desconto, em centavos. */
  @ApiProperty({
    type: Number,
    description: 'Valor do item com desconto, em centavos.',
  })
  valueCents: number;
}

export class PurchaseStoreDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Mercado Bom' })
  name: string;
}

export class PurchaseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  /** Data da compra (YYYY-MM-DD). */
  @ApiProperty({ type: String, example: '2026-11-22' })
  date: string;

  @ApiProperty({ enum: ['DRAFT', 'CONFIRMED'] })
  status: string;

  @ApiProperty({ type: PurchaseStoreDto, nullable: true })
  store: PurchaseStoreDto | null;

  @ApiProperty({ type: [PurchaseItemDto] })
  items: PurchaseItemDto[];

  /** Soma dos itens já com desconto, em centavos. */
  @ApiProperty({
    type: Number,
    description: 'Soma dos itens já com desconto, em centavos.',
  })
  itemsTotalCents: number;

  /** Desconto de caixa (soma dos itens − total pago), em centavos. */
  @ApiProperty({
    type: Number,
    description:
      'Desconto de caixa (soma dos itens − total pago), em centavos.',
  })
  cashDiscountCents: number;

  /** Total da compra, em centavos. */
  @ApiProperty({ type: Number, description: 'Total da compra, em centavos.' })
  totalCents: number;
}

export class PurchaseEnvelopeDto {
  @ApiProperty({ type: PurchaseDto })
  data: PurchaseDto;
}
