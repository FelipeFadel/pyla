import { Injectable, NotFoundException } from '@nestjs/common';
import type { Unit } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface ItemPricing {
  quantity: number;
  packageSize: number;
  unit: Unit;
  fullPriceCents: number;
}

export type NewPurchaseItem = ItemPricing &
  (
    | { productId: string }
    | { name: string; normalizedName: string; categoryId: string }
  );

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Compra, itens e produtos novos numa transação só: falhou, nada fica.
  createConfirmed(data: {
    userId: string;
    date: Date;
    items: NewPurchaseItem[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId: data.userId,
          date: data.date,
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });
      // Cada nome é resolvido uma vez, em ordem fixa (evita deadlock entre
      // compras simultâneas). createMany com skipDuplicates é ON CONFLICT DO
      // NOTHING: a unicidade do banco decide a corrida sem abortar a transação.
      const byName = new Map<string, string>();
      const newItems = data.items.filter((item) => 'normalizedName' in item);
      const firstByName = new Map(
        [...newItems].reverse().map((item) => [item.normalizedName, item]),
      );
      for (const key of [...firstByName.keys()].sort()) {
        const item = firstByName.get(key)!;
        await tx.product.createMany({
          data: [
            {
              userId: data.userId,
              name: item.name,
              normalizedName: key,
              categoryId: item.categoryId,
            },
          ],
          skipDuplicates: true,
        });
        const product = await tx.product.findUniqueOrThrow({
          where: {
            userId_normalizedName: { userId: data.userId, normalizedName: key },
          },
        });
        byName.set(key, product.id);
      }

      for (const item of data.items) {
        let productId: string;
        if ('productId' in item) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, userId: data.userId },
          });
          if (!product) throw new NotFoundException('Produto não encontrado.');
          productId = product.id;
        } else {
          productId = byName.get(item.normalizedName)!;
        }
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId,
            quantity: item.quantity,
            packageSize: item.packageSize,
            unit: item.unit,
            fullPriceCents: item.fullPriceCents,
          },
        });
      }
      // RN07: leitura de compra sempre filtra CONFIRMED.
      return tx.purchase.findFirstOrThrow({
        where: { id: purchase.id, userId: data.userId, status: 'CONFIRMED' },
        include: {
          store: true,
          items: { include: { product: true }, orderBy: { id: 'asc' } },
        },
      });
    });
  }
}
