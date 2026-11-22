import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ownerId nulo = categoria fixa do sistema, a mesma para todos os usuários.
  findAllFixed() {
    return this.prisma.category.findMany({
      where: { ownerId: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
