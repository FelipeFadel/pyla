import { Body, Controller, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from './session.constants.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.register(dto);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      maxAge: SESSION_MAX_AGE_MS,
    });
    return user;
  }
}
