import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';
// Hash bcrypt (custo 12) de um valor descartável; só serve para igualar o tempo.
const FAKE_PASSWORD_HASH =
  '$2b$12$ago1ZCpdr3TcWWB05c3QQefqhK1QSYk4jfvF9HV7Im65QDQMEXpdC';

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

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Compara sempre, mesmo sem usuário, para igualar o tempo de resposta (CA6).
    const valid = await compare(
      dto.password,
      user?.passwordHash ?? FAKE_PASSWORD_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException({ message: INVALID_CREDENTIALS_MESSAGE });
    }
    const token = await this.jwtService.signAsync({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { user: { id: user.id, email: user.email }, token };
  }
}
