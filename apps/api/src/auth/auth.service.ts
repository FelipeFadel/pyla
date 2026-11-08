import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import type { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });
    const token = await this.jwtService.signAsync({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { user: { id: user.id, email: user.email }, token };
  }
}
