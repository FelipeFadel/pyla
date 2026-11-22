import { normalizeName } from './normalize-name.js';

describe('normalizeName', () => {
  it('tira espaços das pontas e põe em minúsculas', () => {
    expect(normalizeName('  Arroz Branco  ')).toBe('arroz branco');
  });

  it('reduz espaços internos repetidos a um', () => {
    expect(normalizeName('Arroz    \t  Branco')).toBe('arroz branco');
  });

  it('remove os acentos', () => {
    expect(normalizeName('Feijão Pão de Açúcar')).toBe('feijao pao de acucar');
  });

  it('devolve vazio para só espaços', () => {
    expect(normalizeName('   ')).toBe('');
  });
});
