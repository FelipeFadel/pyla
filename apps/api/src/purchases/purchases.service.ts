import { BadRequestException, Injectable } from '@nestjs/common';
import { Clock, dateInSaoPaulo } from '../common/clock.js';
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

// Texto que o Postgres recusa (NUL, UTF-16 malformado) ou que some ao
// normalizar (só marcas combinantes): vira 400, nunca 500.
const nameProblem = (name: string): string | undefined => {
  if (name.includes('\u0000') || /\p{Cs}/u.test(name)) {
    return 'O nome tem caracteres inválidos.';
  }
  if (normalizeName(name) === '') return 'Informe um nome com letras ou números.';
  return undefined;
};

// Data real do calendário (rejeita 2026-02-30) e dentro do que o Postgres guarda.
const isRealDate = (date: string): boolean => {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date &&
    parsed.getUTCFullYear() >= 1900
  );
};

@Injectable()
export class PurchasesService {
  constructor(
    private readonly repository: PurchasesRepository,
    private readonly clock: Clock,
  ) {}

  async create(userId: string, dto: CreatePurchaseDto) {
    if (!isRealDate(dto.date)) {
      throw invalidField('date', 'Informe uma data válida (AAAA-MM-DD).');
    }
    if (dto.date > dateInSaoPaulo(this.clock.now())) {
      throw invalidField('date', 'A data da compra não pode estar no futuro.');
    }
    if (dto.storeId !== undefined && dto.storeName !== undefined) {
      throw invalidField(
        'storeId',
        'Informe a loja por storeId OU por storeName, não pelos dois.',
      );
    }
    if (dto.storeName !== undefined) {
      const problem = nameProblem(dto.storeName);
      if (problem) throw invalidField('storeName', problem);
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
      if (item.productId !== undefined) {
        if (item.name !== undefined || item.categoryId !== undefined) {
          throw invalidField(
            `items.${index}.productId`,
            'Informe o produto por productId OU por name e categoryId, não pelos dois.',
          );
        }
      } else {
        const problem = nameProblem(item.name as string);
        if (problem) throw invalidField(`items.${index}.name`, problem);
      }
    });
    // Categoria precisa existir e ser fixa do sistema (CA4).
    const categoryIds = [
      ...new Set(
        dto.items.flatMap((item) =>
          item.productId === undefined ? [item.categoryId as string] : [],
        ),
      ),
    ];
    const fixedIds = await this.repository.findFixedCategoryIds(categoryIds);
    dto.items.forEach((item, index) => {
      if (
        item.productId === undefined &&
        !fixedIds.has(item.categoryId as string)
      ) {
        throw invalidField(
          `items.${index}.categoryId`,
          'A categoria não existe ou não é uma categoria fixa do sistema.',
        );
      }
    });
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
      items: dto.items.map((item) => {
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
