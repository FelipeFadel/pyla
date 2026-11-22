import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PlansController } from './plans.controller.js';
import { PlansRepository } from './plans.repository.js';
import { PlansService } from './plans.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlansRepository, PlansService],
})
export class PlansModule {}
