import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UserEnvelopeDto } from './dto/user-response.dto.js';
import { Public } from './public.decorator.js';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from './session.constants.js';

const UNAUTHORIZED_RESPONSE = {
  status: 401,
  description: 'Sem sessão válida (cookie ausente, adulterado ou expirado).',
  type: ErrorResponseDto,
};
const INTERNAL_ERROR_RESPONSE = {
  status: 500,
  description: 'Erro interno.',
  type: ErrorResponseDto,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('me')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Dados do usuário da sessão' })
  @ApiResponse({
    status: 200,
    description: 'Usuário autenticado.',
    type: UserEnvelopeDto,
  })
  @ApiResponse(UNAUTHORIZED_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  me(@Req() req: Request & { user: { id: string; email: string } }) {
    return { id: req.user.id, email: req.user.email };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cria a conta e abre a sessão' })
  @ApiResponse({
    status: 201,
    description: 'Conta criada; o cookie de sessão vem em Set-Cookie.',
    type: UserEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (com details por campo) ou cadastro recusado (sem details).',
    type: ErrorResponseDto,
  })
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.register(dto);
    this.setSessionCookie(res, token);
    return user;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Abre a sessão com e-mail e senha' })
  @ApiResponse({
    status: 200,
    description: 'Sessão aberta; o cookie de sessão vem em Set-Cookie.',
    type: UserEnvelopeDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos, com details por campo.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'E-mail ou senha inválidos.',
    type: ErrorResponseDto,
  })
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.login(dto);
    this.setSessionCookie(res, token);
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Encerra todas as sessões do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Sessões invalidadas e cookie removido.',
    schema: {
      type: 'object',
      properties: { data: { nullable: true, example: null } },
    },
  })
  @ApiResponse(UNAUTHORIZED_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  async logout(
    @Req() req: Request & { user: { id: string; email: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id);
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get('NODE_ENV') === 'production',
    };
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: SESSION_MAX_AGE_MS,
    });
  }
}
