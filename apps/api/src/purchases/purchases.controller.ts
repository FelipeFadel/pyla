import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../auth/session.constants.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { PurchaseEnvelopeDto } from './dto/purchase-response.dto.js';
import { PurchasesService } from './purchases.service.js';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary: 'Registra uma compra já confirmada, com seus itens',
  })
  @ApiResponse({
    status: 201,
    description: 'Compra registrada com status CONFIRMED.',
    type: PurchaseEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos, com details por campo.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Sem sessão válida.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(req.user.id, dto);
  }
}
