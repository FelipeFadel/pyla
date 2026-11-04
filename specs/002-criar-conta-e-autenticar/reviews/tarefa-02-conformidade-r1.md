# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Rodei `npm run test:e2e` com `JWT_SECRET` e `WEB_ORIGIN` falsos: 3 arquivos, 12 testes, todos passaram. Rodei `npm test`: 1 teste passou. Os erros que aparecem no log do e2e vêm do teste do 500 e são esperados. O stack fica só no log, como o filtro prevê.

## Critérios verificados
| Critério (da spec / plan) | Situação | Onde |
| --- | --- | --- |
| (a) Campo inválido vira 400 com `details` por campo (base do CA3) | atendido | `apps/api/src/common/setup-app.ts:15-45`, `apps/api/test/base-global.e2e-spec.ts` ("campo inválido vira 400…") |
| (a) Campo extra vira 400 apontando o campo | atendido | `forbidNonWhitelisted` em `setup-app.ts`; teste "campo extra…" |
| (b) Sucesso volta em `{ data }` (resposta de todos os CAs) | atendido | `apps/api/src/common/response.interceptor.ts:13`, teste "envolve o sucesso em { data }" |
| (c) Erro desconhecido vira 500 genérico, sem stack nem texto interno | atendido | `apps/api/src/common/http-exception.filter.ts:55-61`, teste do 500 (confere que `segredo interno`, `select` e ` at ` não aparecem) |
| (d) O boot falha sem `JWT_SECRET` | atendido | `apps/api/src/config/env.validation.ts` e `apps/api/src/app.module.ts`; testes de boot (3 casos, usando o `AppModule` real) |
| `.env.example` com `JWT_SECRET` e `WEB_ORIGIN` | atendido | `apps/api/.env.example` |
| `main.ts` aplica a configuração global | atendido | `apps/api/src/main.ts` chama `configureApp`, o mesmo código que os e2e exercitam |
| `cookie-parser` no `package.json` e no `architecture.md` §2, sem registro no `main.ts` | atendido | `apps/api/package.json` e `docs/architecture.md` (+2 linhas). `main.ts` não o usa, como combinado para a Tarefa 6. |
| CA7 (401 em rota interna) e demais CAs de negócio (CA1, CA2, CA4 a CA6, CA8 a CA11) | fora desta tarefa | Guard, auth e front vêm nas tarefas seguintes. O plano diz que esta tarefa só destrava o CA3 e o CA7. |

## Apontamentos

Nenhum.

Observações sem peso de reprovação, só para a triagem:
- `docs/architecture.md` §2.1 (linhas 137-138) diz que o filtro traduz `P2002` do Prisma para 4xx. O filtro desta tarefa não faz isso: um erro `P2002` cairia em 500. O plano não pede isso na Tarefa 2 (CA2 e CA9 pertencem às tarefas de cadastro). A tarefa que tratar a unicidade precisa cobrir essa tradução ou capturar o erro no service.
- Alguns itens vão além dos testes (a) a (d) do plano: o teste do 404, o do CORS e as mensagens padrão para 401, 403 e 409. O CORS usa a `WEB_ORIGIN` que o plano já prevê, e as mensagens em português seguem a §2.1. Não considerei escopo inflado.
