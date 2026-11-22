import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeName } from '../common/normalize-name.js';
import { ProductsRepository } from './products.repository.js';

const SEARCH_LIMIT = 20;

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  search(userId: string, search: string) {
    const term = normalizeName(search);
    // NUL o Postgres recusa (vira 400, nunca 500). Só marcas combinantes somem
    // ao normalizar, e "contém vazio" listaria tudo.
    if (search.includes('\u0000') || term === '') {
      throw new BadRequestException({
        message: 'Dados inválidos.',
        details: [
          {
            field: 'search',
            messages: [
              'Informe um termo com letras ou números, sem caracteres inválidos.',
            ],
          },
        ],
      });
    }
    return this.repository.searchByName(userId, term, SEARCH_LIMIT);
  }
}
