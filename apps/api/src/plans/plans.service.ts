import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreatePlanDto } from './dto/create-plan.dto.js';
import type { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlansRepository } from './plans.repository.js';

const UNIQUE_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';
const FOREIGN_KEY_VIOLATION = 'P2003';
const HAS_SUBSCRIBERS_MESSAGE =
  'Este plano tem assinantes e não pode ser excluído; desative-o em vez de excluí-lo.';
const DUPLICATE_NAME_MESSAGE = 'Já existe um plano com esse nome.';
const PLAN_NOT_FOUND_MESSAGE = 'Plano não encontrado.';

@Injectable()
export class PlansService {
  constructor(private readonly repository: PlansRepository) {}

  async create(dto: CreatePlanDto) {
    try {
      const plan = await this.repository.create({
        name: dto.name,
        nameKey: dto.name.toLowerCase(),
        priceCents: Math.round(dto.price * 100),
      });
      return this.toDto(plan);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async update(id: string, dto: UpdatePlanDto) {
    try {
      const plan = await this.repository.update(id, {
        ...(dto.name !== undefined && {
          name: dto.name,
          nameKey: dto.name.toLowerCase(),
        }),
        ...(dto.price !== undefined && {
          priceCents: Math.round(dto.price * 100),
        }),
        ...(dto.active !== undefined && { active: dto.active }),
      });
      return this.toDto(plan);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  // RN25: plano com assinantes não pode ser excluído. A FK Restrict (P2003)
  // cobre a corrida entre a checagem e a exclusão.
  async remove(id: string) {
    if ((await this.repository.countSubscriptions(id)) > 0) {
      throw this.hasSubscribersError();
    }
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async findAll() {
    const plans = await this.repository.findAll();
    return plans.map((plan) => this.toDto(plan));
  }

  async findAvailable() {
    const plans = await this.repository.findAllActive();
    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.priceCents / 100,
    }));
  }

  // O índice único em nameKey decide a corrida (CA5); sem checagem prévia.
  // Reconhece o erro pelo code, sem importar o Prisma Client no service.
  private translateWriteError(error: unknown): unknown {
    const code =
      typeof error === 'object' && error !== null
        ? (error as { code?: unknown }).code
        : undefined;
    if (code === UNIQUE_VIOLATION) {
      return new ConflictException({
        message: DUPLICATE_NAME_MESSAGE,
        details: [{ field: 'name', messages: [DUPLICATE_NAME_MESSAGE] }],
      });
    }
    if (code === RECORD_NOT_FOUND) {
      return new NotFoundException({ message: PLAN_NOT_FOUND_MESSAGE });
    }
    if (code === FOREIGN_KEY_VIOLATION) {
      return this.hasSubscribersError();
    }
    return error;
  }

  private hasSubscribersError() {
    return new ConflictException({ message: HAS_SUBSCRIBERS_MESSAGE });
  }

  private toDto(plan: {
    id: string;
    name: string;
    priceCents: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: plan.id,
      name: plan.name,
      price: plan.priceCents / 100,
      active: plan.active,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
