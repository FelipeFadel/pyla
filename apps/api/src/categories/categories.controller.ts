import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { SESSION_COOKIE } from '../auth/session.constants.js';
import { CategoryListEnvelopeDto } from './dto/category-response.dto.js';
import { CategoriesService } from './categories.service.js';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary: 'Lista as categorias fixas do sistema, em ordem alfabética',
  })
  @ApiResponse({
    status: 200,
    description: 'Categorias fixas, com id e nome.',
    type: CategoryListEnvelopeDto,
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
  findAll() {
    return this.categoriesService.findAll();
  }
}
