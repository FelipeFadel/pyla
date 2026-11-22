import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { email: string; passwordHash: string }) {
    // O papel nunca vem do cliente: toda conta nasce CUSTOMER (CA15).
    return this.prisma.user.create({ data: { ...data, role: 'CUSTOMER' } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Incremento atômico no banco: invalida todos os tokens emitidos (CA8).
  incrementTokenVersion(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });
  }
}
