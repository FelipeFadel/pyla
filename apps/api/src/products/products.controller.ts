import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../auth/session.constants.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { ProductListEnvelopeDto } from './dto/product-response.dto.js';
import { SearchProductsQueryDto } from './dto/search-products-query.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Busca os produtos do usuário pelo nome, em ordem alfabética (até 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Produtos cujo nome contém o termo, com id, nome e categoria.',
    type: ProductListEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Termo ausente, vazio, longo demais ou inválido.',
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
  search(
    @Req() req: Request & { user: { id: string } },
    @Query() query: SearchProductsQueryDto,
  ) {
    return this.productsService.search(req.user.id, query.search);
  }
}
