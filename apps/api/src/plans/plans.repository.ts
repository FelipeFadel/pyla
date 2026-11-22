import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { name: string; nameKey: string; priceCents: number }) {
    return this.prisma.plan.create({ data });
  }

  update(
    id: string,
    data: {
      name?: string;
      nameKey?: string;
      priceCents?: number;
      active?: boolean;
    },
  ) {
    return this.prisma.plan.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  countSubscriptions(planId: string) {
    return this.prisma.subscription.count({ where: { planId } });
  }

  // nameKey é o nome em minúsculas: ordena sem diferenciar maiúsculas.
  findAll() {
    return this.prisma.plan.findMany({ orderBy: { nameKey: 'asc' } });
  }

  findAllActive() {
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { nameKey: 'asc' },
    });
  }
}
