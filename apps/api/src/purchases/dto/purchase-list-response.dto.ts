// Corpo de sucesso de GET /purchases, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';
import { PurchaseStoreDto } from './purchase-response.dto.js';

export class PurchaseSummaryDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  /** Data da compra (YYYY-MM-DD). */
  @ApiProperty({ type: String, example: '2026-11-22' })
  date: string;

  @ApiProperty({ type: PurchaseStoreDto, nullable: true })
  store: PurchaseStoreDto | null;

  /** Total da compra (soma dos itens com desconto − desconto de caixa), em centavos. */
  @ApiProperty({ type: Number })
  totalCents: number;

  /** Quantidade de itens da compra. */
  @ApiProperty({ type: Number })
  itemsCount: number;
}

export class PurchaseListEnvelopeDto {
  @ApiProperty({ type: [PurchaseSummaryDto] })
  data: PurchaseSummaryDto[];
}
