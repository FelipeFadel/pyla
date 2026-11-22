import { Module } from '@nestjs/common';
import { Clock } from '../common/clock.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PurchasesController } from './purchases.controller.js';
import { PurchasesRepository } from './purchases.repository.js';
import { PurchasesService } from './purchases.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasesController],
  providers: [Clock, PurchasesRepository, PurchasesService],
})
export class PurchasesModule {}
