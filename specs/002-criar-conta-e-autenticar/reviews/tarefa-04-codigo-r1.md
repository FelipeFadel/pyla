# Parecer de Código — Tarefa 4 (rodada de revisão 1)

**Veredito:** APROVADO

Não achei nenhum apontamento bloqueante contra o `docs/architecture.md`. A rodada de testes tem uma instabilidade, descrita no fim, que não consegui atribuir a este diff.

## Apontamentos (bloqueiam)
Nenhum.

Conferido contra o diff:
- **Camadas (§2.1):** `auth.service.ts` não foi tocado. O service e o repository não ganharam checagem prévia de e-mail, então a corrida entre dois cadastros simultâneos é resolvida pela unicidade do banco. A mudança fica toda no filtro.
- **Tradução do P2002 (§2.1, "Formato de resposta e de erro"):** a arquitetura manda o filtro traduzir `P2002` para 4xx. `http-exception.filter.ts:54-58` faz isso. A resposta mantém o formato global (`statusCode`, `error`, `message`, `path`, `timestamp`), em português e sem `details`. O valor repetido, o `meta` e o texto do Prisma não saem na resposta.
- **Sem importar o Prisma Client:** `isUniqueViolation` (`http-exception.filter.ts:77-83`) reconhece o erro pelo `code`. O filtro fica em `common/` sem depender do client gerado.
- **Testes:** `apps/api/test/auth-register-duplicado.e2e-spec.ts` cobre o que a tarefa pede:
  - repetição exata e repetição com ` A@X.com `, ambas com 400 genérico e uma só linha no banco;
  - `Promise.all` com um 201 e um 400;
  - a mesma mensagem para qualquer e-mail repetido;
  - regressão do `details` por campo nos erros de formato.

  Os testes passam pela API e pelo banco, sem depender de detalhe interno.

## Sugestões (não bloqueiam)
- `UNIQUE_VIOLATION_MESSAGE = 'Não foi possível concluir o cadastro.'` (`http-exception.filter.ts:35`) vale para todo `P2002` do sistema. Hoje só o cadastro de usuário gera esse erro. Quando outra entidade tiver unicidade (por exemplo `Product`, RN10), a mensagem fala em "cadastro" e pode não combinar. Uma mensagem neutra ou um ajuste por contexto evita surpresa depois.
- O ramo do `P2002` não grava nada no log, enquanto o ramo do 500 grava. Um `logger.warn` com o código, sem o valor do e-mail, ajudaria a depurar sem vazar dado.
- O bootstrap do app (`beforeAll`, `beforeEach` e `afterAll`) é igual ao de `auth-register.e2e-spec.ts`. É duplicação pequena. Vale um helper em `test/` se aparecer um terceiro e2e de auth.

## Observações fora do escopo deste diff
- **Testes e2e instáveis:** `npm run test:e2e` falhou várias vezes seguidas sob o mesmo código, e `npm test` passou (1/1).
  - Rodei o conjunto completo oito vezes. Duas passaram (35/35) e seis falharam, com 1 a 3 testes cada, em `auth-register-duplicado` e `auth-register`.
  - Os erros foram "esperava 201, veio 400" no primeiro cadastro e "esperava 400, veio 201" na repetição. É o padrão de outra execução apagando ou criando usuários no mesmo banco (`prisma.user.deleteMany()` no `beforeEach` de cada arquivo).
  - O `fileParallelism: false` do `vitest.config.e2e.ts` já está ligado. O arquivo novo isolado passou 6 de 7 vezes.
  - Não consegui provar quem escreveu no banco. Pode ser outra execução simultânea no mesmo Postgres, como o revisor de conformidade rodando junto. Antes de a triagem tratar isso como defeito do diff, rode o e2e sozinho, com nenhum outro processo usando o banco.
  - Se continuar instável nessas condições, abra uma Issue de manutenção para dar um banco ou schema isolado por execução de e2e.
