import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  findAll() {
    return this.repository.findAllFixed();
  }
}
