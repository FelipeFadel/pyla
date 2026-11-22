import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// Escapa a barra, % e _ com barra invertida (escape padrão do LIKE no Postgres).
const escapeLike = (term: string) => term.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // O termo já vem normalizado, como o normalizedName gravado. O `name`
  // original só serve para exibir. O `contains` do Prisma NÃO escapa os
  // curingas do LIKE (% e _), então o escape é feito aqui.
  searchByName(userId: string, normalizedTerm: string, limit: number) {
    return this.prisma.product.findMany({
      where: {
        userId,
        normalizedName: { contains: escapeLike(normalizedTerm) },
      },
      select: {
        id: true,
        name: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ normalizedName: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }
}
