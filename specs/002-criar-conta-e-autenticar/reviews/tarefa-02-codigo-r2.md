# Parecer de Código — Tarefa 2 (rodada 2)

**Veredito:** APROVADO

Rodei os três comandos. `npm run test:e2e` passou (3 arquivos, 12 testes). `npm test` passou (1 teste). `npm run lint` rodou sem erros. Os stack traces no log do e2e vêm do teste do erro 500, que lança de propósito. O `AllExceptionsFilter` os registra no servidor e a resposta ao cliente não os traz.

## Apontamentos (bloqueiam)
Nenhum. O diff só mexe no teste, e a correção resolve o acoplamento ao `.env`.
- O `ConfigModule.forRoot` em `apps/api/src/app.module.ts:8` não define `envFilePath`, então lê `.env` de `process.cwd()`. Rodar esses testes num diretório temporário vazio é um isolamento coerente com isso.
- O `beforeAll` e o `afterAll` ficam dentro do `describe` de boot, em `apps/api/test/base-global.e2e-spec.ts`. O cwd só muda durante esse bloco e é restaurado depois, mesmo que um teste falhe.
- O `rmSync` com `force` limpa o diretório temporário.
- Nenhum código de produção foi alterado.

## Sugestões (não bloqueiam)
- **Fragilidade do `process.chdir`:** é real, mas pequena.
  - O `apps/api/vitest.config.e2e.ts` não fixa `pool`. Hoje funciona porque o padrão do vitest 4.1.12 (versão instalada) é `forks`.
  - Se alguém passar a usar `pool: 'threads'` ou `--pool=threads`, o `chdir` lança `ERR_WORKER_UNSUPPORTED_OPERATION` e o `beforeAll` falha. A falha seria barulhenta, não silenciosa.
  - O ganho de fixar `pool: 'forks'` no config e2e é tornar a premissa explícita, com um comentário de uma linha. A alternativa é `envFilePath` configurável no `AppModule`, mas isso mexeria em produção só por causa de teste, então eu não faria.
  - Não é bloqueio, porque não há prejuízo hoje. O prejuízo concreto seria uma falha de teste ruidosa e fácil de diagnosticar.
- **Isolamento entre arquivos:** o `chdir` só afeta o worker daquele arquivo, porque o vitest isola cada arquivo de teste (`isolate` é verdadeiro por padrão). O `apps/api/src/users/users.repository.e2e-spec.ts` continua dependendo do `.env` de `cwd`, e isso é esperado, pois ele precisa do banco real. Esse isolamento depende de `isolate` continuar ligado e vale como segunda premissa a documentar junto com a do pool.

## Observações fora do escopo deste diff
- Nenhuma nova. O teste do repositório depende do `.env` e do Postgres local por desenho, o que é aceitável para e2e.
