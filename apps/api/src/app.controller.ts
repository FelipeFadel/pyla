import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { SESSION_COOKIE } from './auth/session.constants.js';
import { ErrorResponseDto } from './common/dto/error-response.dto.js';

@ApiTags('app')
@ApiCookieAuth(SESSION_COOKIE)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Mensagem de boas-vindas da API' })
  @ApiResponse({
    status: 200,
    description: 'Texto de boas-vindas.',
    schema: {
      type: 'object',
      properties: { data: { type: 'string', example: 'Hello World!' } },
    },
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
  getHello(): string {
    return this.appService.getHello();
  }
}
