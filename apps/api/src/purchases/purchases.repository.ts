import { Injectable, NotFoundException } from '@nestjs/common';
import type { Unit } from '../generated/prisma/enums.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface ItemPricing {
  quantity: number;
  packageSize: number;
  unit: Unit;
  fullPriceCents: number;
  discountCents: number;
}

export type NewPurchaseItem = ItemPricing &
  (
    | { productId: string }
    | { name: string; normalizedName: string; categoryId: string }
  );

export type NewPurchaseStore =
  | { storeId: string }
  | { name: string; normalizedName: string };

// Compra completa: loja (sem coordenadas), itens, produto e categoria.
const detailInclude = {
  store: { select: { id: true, name: true } },
  items: {
    include: {
      product: { include: { category: { select: { id: true, name: true } } } },
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.PurchaseInclude;

@Injectable()
export class PurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Dos ids recebidos, os que são de categoria fixa do sistema (ownerId nulo).
  async findFixedCategoryIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.category.findMany({
      where: { id: { in: ids }, ownerId: null },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  }

  // Compras confirmadas do usuário, da mais recente para a mais antiga: data e,
  // na mesma data, a confirmada depois primeiro (Purchase não tem createdAt;
  // confirmedAt é gravado na criação). Uma consulta só, itens inclusos.
  findConfirmedByUser(userId: string) {
    return this.prisma.purchase.findMany({
      where: { userId, status: 'CONFIRMED' },
      orderBy: [{ date: 'desc' }, { confirmedAt: 'desc' }, { id: 'desc' }],
      include: {
        store: { select: { id: true, name: true } },
        items: {
          select: { quantity: true, fullPriceCents: true, discountCents: true },
        },
      },
    });
  }

  // Sempre filtra userId e CONFIRMED: de outro usuário ou rascunho = null.
  findConfirmedById(userId: string, id: string) {
    return this.prisma.purchase.findFirst({
      where: { id, userId, status: 'CONFIRMED' },
      include: detailInclude,
    });
  }

  // Compra, itens e produtos novos numa transação só: falhou, nada fica.
  createConfirmed(data: {
    userId: string;
    date: Date;
    paidTotalCents?: number;
    store?: NewPurchaseStore;
    items: NewPurchaseItem[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      let storeId: string | null = null;
      if (data.store && 'storeId' in data.store) {
        const store = await tx.store.findFirst({
          where: { id: data.store.storeId, userId: data.userId },
        });
        if (!store) throw new NotFoundException('Loja não encontrada.');
        storeId = store.id;
      } else if (data.store) {
        // Mesma técnica dos produtos: a unicidade do banco decide a corrida.
        await tx.store.createMany({
          data: [
            {
              userId: data.userId,
              name: data.store.name,
              normalizedName: data.store.normalizedName,
            },
          ],
          skipDuplicates: true,
        });
        const store = await tx.store.findUniqueOrThrow({
          where: {
            userId_normalizedName: {
              userId: data.userId,
              normalizedName: data.store.normalizedName,
            },
          },
        });
        storeId = store.id;
      }

      const purchase = await tx.purchase.create({
        data: {
          userId: data.userId,
          storeId,
          date: data.date,
          paidTotalCents: data.paidTotalCents,
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
            discountCents: item.discountCents,
          },
        });
      }
      // RN07: leitura de compra sempre filtra CONFIRMED.
      return tx.purchase.findFirstOrThrow({
        where: { id: purchase.id, userId: data.userId, status: 'CONFIRMED' },
        include: detailInclude,
      });
    });
  }
}
