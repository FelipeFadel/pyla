import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums.js';
import { AtLeastOneFieldPipe } from '../common/at-least-one-field.pipe.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { SESSION_COOKIE } from '../auth/session.constants.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { PlanIdParamDto } from './dto/plan-id-param.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import {
  AvailablePlanListEnvelopeDto,
  PlanEnvelopeDto,
  PlanListEnvelopeDto,
} from './dto/plan-response.dto.js';
import { PlansService } from './plans.service.js';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Cria um plano de assinatura (administrador)' })
  @ApiResponse({
    status: 201,
    description: 'Plano criado, ativo.',
    type: PlanEnvelopeDto,
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
    status: 403,
    description: 'Usuário não é administrador.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um plano com esse nome.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Lista todos os planos, ativos e inativos, em ordem alfabética (administrador)',
  })
  @ApiResponse({
    status: 200,
    description: 'Planos; lista vazia se não existe nenhum.',
    type: PlanListEnvelopeDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Sem sessão válida.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é administrador.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  findAll() {
    return this.plansService.findAll();
  }

  // Rota estática: deve ficar antes de qualquer rota com parâmetro (:id).
  @Get('available')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Lista os planos ativos disponíveis para assinar, em ordem alfabética',
  })
  @ApiResponse({
    status: 200,
    description: 'Planos ativos, com id, nome e preço.',
    type: AvailablePlanListEnvelopeDto,
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
  findAvailable() {
    return this.plansService.findAvailable();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Edita nome, preço e/ou estado ativo de um plano (administrador); assinaturas existentes não mudam',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano atualizado.',
    type: PlanEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados ou id inválidos, com details por campo.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Sem sessão válida.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é administrador.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe um plano com esse nome.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  update(
    @Param() params: PlanIdParamDto,
    @Body(new AtLeastOneFieldPipe<UpdatePlanDto>(['name', 'price', 'active']))
    dto: UpdatePlanDto,
  ) {
    return this.plansService.update(params.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary:
      'Exclui um plano sem assinantes (administrador); com assinantes, desative-o',
  })
  @ApiResponse({ status: 204, description: 'Plano excluído, sem corpo.' })
  @ApiResponse({
    status: 400,
    description: 'Id inválido, com details por campo.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Sem sessão válida.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é administrador.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Plano com assinantes não pode ser excluído; desative-o.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno.',
    type: ErrorResponseDto,
  })
  remove(@Param() params: PlanIdParamDto) {
    return this.plansService.remove(params.id);
  }
}
