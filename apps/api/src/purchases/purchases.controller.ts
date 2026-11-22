import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
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
import { PurchaseIdParamDto } from './dto/purchase-id-param.dto.js';
import { PurchaseListEnvelopeDto } from './dto/purchase-list-response.dto.js';
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
    status: 404,
    description:
      'productId ou storeId inexistente ou de outro usuário (CA5 e CA9).',
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

  @Get()
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Lista as compras do usuário, da mais recente para a mais antiga',
  })
  @ApiResponse({
    status: 200,
    description: 'Compras com loja, total e quantidade de itens.',
    type: PurchaseListEnvelopeDto,
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
  list(@Req() req: Request & { user: { id: string } }) {
    return this.purchasesService.list(req.user.id);
  }

  @Get(':id')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Consulta uma compra do usuário com seus itens' })
  @ApiResponse({
    status: 200,
    description:
      'Compra com itens, produto (nome e categoria), valores e totais.',
    type: PurchaseEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'O id não é um UUID válido.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Sem sessão válida.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Compra não encontrada (inexistente ou de outro usuário).',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  findOne(
    @Req() req: Request & { user: { id: string } },
    @Param() params: PurchaseIdParamDto,
  ) {
    return this.purchasesService.findOne(req.user.id, params.id);
  }
}
