// Corpo de sucesso de GET /purchases, já no envelope { data } do interceptor.
import { ApiProperty } from '@nestjs/swagger';
import { PurchaseStoreDto } from './purchase-response.dto.js';

export class PurchaseSummaryDto {
  id: string;

  /** Data da compra (YYYY-MM-DD). */
  date: string;

  @ApiProperty({ type: PurchaseStoreDto, nullable: true })
  store: PurchaseStoreDto | null;

  /** Total da compra (soma dos itens com desconto − desconto de caixa), em centavos. */
  totalCents: number;

  /** Quantidade de itens da compra. */
  itemsCount: number;
}

export class PurchaseListEnvelopeDto {
  @ApiProperty({ type: [PurchaseSummaryDto] })
  data: PurchaseSummaryDto[];
}
