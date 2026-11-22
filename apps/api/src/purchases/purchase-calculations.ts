// Regras de valor da compra, puras (sem Nest, sem Prisma). Dinheiro em centavos.

export interface PriceableItem {
  fullPriceCents: number;
  quantity: number;
}

export interface DiscountedItem extends PriceableItem {
  discountCents: number;
}

// round(fullPriceCents × quantity), meio-centavo para cima. A quantidade tem
// até 3 casas: trabalha em milésimos inteiros para não sofrer com float.
export function itemFullValueCents(item: PriceableItem): number {
  const quantityMillis = Math.round(item.quantity * 1000);
  return Math.floor((item.fullPriceCents * quantityMillis + 500) / 1000);
}

export function itemValueCents(item: DiscountedItem): number {
  return itemFullValueCents(item) - item.discountCents;
}

export function sumItemsCents(items: DiscountedItem[]): number {
  return items.reduce((total, item) => total + itemValueCents(item), 0);
}
