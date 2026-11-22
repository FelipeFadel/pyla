import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PurchasesController } from './purchases.controller.js';
import { PurchasesRepository } from './purchases.repository.js';
import { PurchasesService } from './purchases.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController],
  providers: [PurchasesRepository, PurchasesService],
})
export class PurchasesModule {}
