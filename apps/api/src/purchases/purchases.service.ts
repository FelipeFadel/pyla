import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeName } from '../common/normalize-name.js';
import type { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import {
  cashDiscountCents,
  itemFullValueCents,
  itemValueCents,
  purchaseTotalCents,
  sumItemsCents,
} from './purchase-calculations.js';
import {
  type NewPurchaseStore,
  PurchasesRepository,
} from './purchases.repository.js';

// Mesmo formato do ValidationPipe: { message, details: [{ field, messages }] }.
const invalidField = (field: string, message: string) =>
  new BadRequestException({
    message: 'Dados inválidos.',
    details: [{ field, messages: [message] }],
  });

@Injectable()
export class PurchasesService {
  constructor(private readonly repository: PurchasesRepository) {}

  async create(userId: string, dto: CreatePurchaseDto) {
    if (dto.storeId !== undefined && dto.storeName !== undefined) {
      throw new BadRequestException(
        'storeId: informe a loja por storeId OU por storeName, não pelos dois.',
      );
    }
    let store: NewPurchaseStore | undefined;
    if (dto.storeId !== undefined) {
      store = { storeId: dto.storeId };
    } else if (dto.storeName !== undefined) {
      store = {
        name: dto.storeName,
        normalizedName: normalizeName(dto.storeName),
      };
    }

    // Regras de valor antes de gravar: recusa por inteiro, nada é escrito.
    dto.items.forEach((item, index) => {
      const fullValue = itemFullValueCents(item);
      if ((item.discountCents ?? 0) > fullValue) {
        throw invalidField(
          `items.${index}.discountCents`,
          `O desconto não pode passar do valor cheio do item (${fullValue}).`,
        );
      }
    });
    if (dto.paidTotalCents !== undefined) {
      const maxPaid = sumItemsCents(
        dto.items.map((item) => ({
          fullPriceCents: item.fullPriceCents,
          quantity: item.quantity,
          discountCents: item.discountCents ?? 0,
        })),
      );
      if (dto.paidTotalCents > maxPaid) {
        throw invalidField(
          'paidTotalCents',
          `O total pago não pode passar da soma dos itens com desconto (${maxPaid}).`,
        );
      }
    }

    const purchase = await this.repository.createConfirmed({
      userId,
      date: new Date(`${dto.date}T00:00:00.000Z`),
      paidTotalCents: dto.paidTotalCents,
      store,
      items: dto.items.map((item, index) => {
        const priced = {
          quantity: item.quantity,
          packageSize: item.packageSize,
          unit: item.unit,
          fullPriceCents: item.fullPriceCents,
          discountCents: item.discountCents ?? 0,
        };
        if (item.productId === undefined) {
          const name = item.name as string;
          return {
            ...priced,
            name,
            normalizedName: normalizeName(name),
            categoryId: item.categoryId as string,
          };
        }
        if (item.name !== undefined || item.categoryId !== undefined) {
          throw new BadRequestException(
            `items.${index}.productId: informe o produto por productId OU por name e categoryId, não pelos dois.`,
          );
        }
        return { ...priced, productId: item.productId };
      }),
    });

    const items = purchase.items.map((item) => {
      const priced = {
        quantity: Number(item.quantity),
        fullPriceCents: item.fullPriceCents,
        discountCents: item.discountCents,
      };
      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          categoryId: item.product.categoryId,
        },
        quantity: priced.quantity,
        packageSize: Number(item.packageSize),
        unit: item.unit,
        fullPriceCents: item.fullPriceCents,
        discountCents: item.discountCents,
        valueCents: itemValueCents(priced),
      };
    });
    const itemsTotalCents = sumItemsCents(items);

    return {
      id: purchase.id,
      date: purchase.date.toISOString().slice(0, 10),
      status: purchase.status,
      store: purchase.store
        ? { id: purchase.store.id, name: purchase.store.name }
        : null,
      items,
      itemsTotalCents,
      cashDiscountCents: cashDiscountCents(
        itemsTotalCents,
        dto.paidTotalCents,
      ),
      totalCents: purchaseTotalCents(itemsTotalCents, dto.paidTotalCents),
    };
  }
}
