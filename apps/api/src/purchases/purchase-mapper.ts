// Mapeamento da compra gravada para os números da resposta. Reaproveita as
// regras puras de purchase-calculations.ts; a tarefa 8 também usa.
import type { Unit } from '../generated/prisma/enums.js';
import {
  cashDiscountCents,
  itemValueCents,
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

export const toStoreRef = (
  store: { id: string; name: string } | null,
): { id: string; name: string } | null =>
  store ? { id: store.id, name: store.name } : null;

export interface StoredPurchase {
  id: string;
  date: Date;
  status: string;
  paidTotalCents: number | null;
  store: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: { toString(): string } | number;
    packageSize: { toString(): string } | number;
    unit: Unit;
    fullPriceCents: number;
    discountCents: number;
    product: {
      id: string;
      name: string;
      categoryId: string;
      category: { id: string; name: string };
    };
  }[];
}

// Compra gravada (com itens, produto e categoria) no corpo de POST e GET por id.
export function toPurchaseDto(purchase: StoredPurchase) {
  return {
    id: purchase.id,
    date: toDateString(purchase.date),
    status: purchase.status,
    store: toStoreRef(purchase.store),
    items: purchase.items.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        categoryId: item.product.categoryId,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
        },
      },
      quantity: Number(item.quantity),
      packageSize: Number(item.packageSize),
      unit: item.unit,
      fullPriceCents: item.fullPriceCents,
      discountCents: item.discountCents,
      valueCents: itemValueCents({
        quantity: Number(item.quantity),
        fullPriceCents: item.fullPriceCents,
        discountCents: item.discountCents,
      }),
    })),
    ...toPurchaseTotals(purchase.items, purchase.paidTotalCents),
  };
}
