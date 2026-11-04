# Parecer de Conformidade — Tarefa 2 (rodada 2)

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| (a) Campo extra ou inválido vira 400 com `details` por campo | atendido (sem alteração desde a r1; segue passando) | apps/api/test/base-global.e2e-spec.ts |
| (b) Sucesso volta em `{ data }` | atendido (sem alteração; segue passando) | apps/api/test/base-global.e2e-spec.ts |
| (c) Erro desconhecido vira 500 genérico sem stack | atendido (sem alteração; segue passando) | apps/api/test/base-global.e2e-spec.ts |
| (d) O boot falha sem `JWT_SECRET` | atendido, e agora independe do .env | apps/api/test/base-global.e2e-spec.ts:147-160, 176-180 |
| Apontamento aceito da r1 (testes de boot dependiam do conteúdo do .env) | resolvido | apps/api/test/base-global.e2e-spec.ts:147-160 |
| Nada além disso mudou | confirmado | `git diff` |

## Evidências
- O diff contra c53001f tem um arquivo de código: `apps/api/test/base-global.e2e-spec.ts` (+19/-1). Os outros são os arquivos de reviews, que foram ignorados.
- O bloco de boot agora cria um diretório temporário vazio em `beforeAll`, faz `process.chdir` para ele e restaura o diretório e remove o temporário em `afterAll`. O ConfigModule lê o .env a partir de `process.cwd()`, então não encontra mais o .env real e não repõe `JWT_SECRET` em `process.env`.
- O resto do diff é a remoção de um comentário.
- Não há mudança em `src/` nem nas asserções. O teste (d) continua com `rejects.toThrow(/JWT_SECRET/)`.
- Rodei `npm run test:e2e` em apps/api, com o .env real completo e o Postgres local. Passaram 3 arquivos e 12 testes. Os logs de ERROR no console vêm do `AllExceptionsFilter` no teste (c), que é esperado.
- Rodei `npm test`. Passou 1 arquivo, 1 teste.
- Não li nem imprimi o .env.
- Não executei o teste sem o isolamento. Aceitei a descrição de que ele falhava antes, mas o resultado verde com .env completo é coerente com a correção.

## Apontamentos
Nenhum.
