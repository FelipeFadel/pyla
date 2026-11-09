import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../users/users.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { SESSION_COOKIE } from './session.constants.js';

const INVALID_SESSION_MESSAGE = 'Sessão inválida ou expirada.';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || token === '') throw this.unauthorized();

    let payload: { sub?: unknown; tokenVersion?: unknown };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw this.unauthorized();
    }
    if (typeof payload.sub !== 'string') throw this.unauthorized();

    const user = await this.usersService.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw this.unauthorized();
    }

    (request as Request & { user?: unknown }).user = {
      id: user.id,
      email: user.email,
    };
    return true;
  }

  private unauthorized() {
    return new UnauthorizedException({ message: INVALID_SESSION_MESSAGE });
  }
}
