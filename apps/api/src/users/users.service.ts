import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  create(data: { email: string; passwordHash: string }) {
    return this.repository.create(data);
  }

  findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }
}
