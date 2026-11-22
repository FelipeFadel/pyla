import { Injectable } from '@nestjs/common';
import type { Unit } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface NewPurchaseItem {
  name: string;
  normalizedName: string;
  categoryId: string;
  quantity: number;
  packageSize: number;
  unit: Unit;
  fullPriceCents: number;
}

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
      for (const item of data.items) {
        const product = await tx.product.create({
          data: {
            userId: data.userId,
            name: item.name,
            normalizedName: item.normalizedName,
            categoryId: item.categoryId,
          },
        });
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: product.id,
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
