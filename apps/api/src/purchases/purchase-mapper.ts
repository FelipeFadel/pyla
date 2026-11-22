// Mapeamento da compra gravada para os números da resposta. Reaproveita as
// regras puras de purchase-calculations.ts; a tarefa 8 também usa.
import {
  cashDiscountCents,
  purchaseTotalCents,
  sumItemsCents,
} from './purchase-calculations.js';

export interface StoredPricedItem {
  quantity: { toString(): string } | number;
  fullPriceCents: number;
  discountCents: number;
}

export function toPurchaseTotals(
  items: StoredPricedItem[],
  paidTotalCents: number | null | undefined,
) {
  const paid = paidTotalCents ?? undefined;
  const itemsTotalCents = sumItemsCents(
    items.map((item) => ({
      quantity: Number(item.quantity),
      fullPriceCents: item.fullPriceCents,
      discountCents: item.discountCents,
    })),
  );
  return {
    itemsTotalCents,
    cashDiscountCents: cashDiscountCents(itemsTotalCents, paid),
    totalCents: purchaseTotalCents(itemsTotalCents, paid),
  };
}

export const toDateString = (date: Date): string =>
  date.toISOString().slice(0, 10);
