import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeName } from '../common/normalize-name.js';
import type { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { itemValueCents, sumItemsCents } from './purchase-calculations.js';
import {
  type NewPurchaseStore,
  PurchasesRepository,
} from './purchases.repository.js';

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

    const purchase = await this.repository.createConfirmed({
      userId,
      date: new Date(`${dto.date}T00:00:00.000Z`),
      store,
      items: dto.items.map((item, index) => {
        const priced = {
          quantity: item.quantity,
          packageSize: item.packageSize,
          unit: item.unit,
          fullPriceCents: item.fullPriceCents,
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
      // TODO #3: o desconto de caixa (paidTotalCents) entra na tarefa 5.
      totalCents: itemsTotalCents,
    };
  }
}
