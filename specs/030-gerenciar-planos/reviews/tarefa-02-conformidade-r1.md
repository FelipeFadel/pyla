# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

Execução: `npm run test:e2e -w apps/api` passou, com 9 arquivos e 61 testes. Os logs de ERROR no console vêm do probe do `base-global.e2e-spec.ts`, que é intencional e anterior a esta tarefa. `npm test -w apps/api` passou (1/1). `npm run lint -w apps/api` rodou sem avisos. Não rodei git add nem commit e não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA13, base do 403: autenticado sem o papel exigido recebe 403 | atendido. Corpo no formato do filtro global (statusCode, error, path, message, timestamp, sem `data`). | `roles.guard.ts:30-33`; `roles.e2e-spec.ts:88-100` |
| CA14, sem sessão: 401 | atendido | `roles.e2e-spec.ts:83-86`, `:128-132`, `:138-142` |
| CA16, admin rebaixado no banco: 403 na requisição seguinte, mesma sessão | atendido. O teste dá 200, rebaixa via prisma e dá 403 com o mesmo cookie. Isso funciona porque o `JwtAuthGuard` relê o papel do banco a cada requisição. | `roles.e2e-spec.ts:109-116`; `jwt-auth.guard.ts` (`role: user.role`) |
| Ordem dos guards (Jwt antes de Roles) | atendido. `APP_GUARD` registra Jwt e depois Roles (`auth.module.ts:26-27`). O 401 sem sessão em rota `@Roles` prova a ordem: se o `RolesGuard` rodasse primeiro, não haveria `user` e ele devolveria 403, não 401. | `auth.module.ts`; `roles.e2e-spec.ts:83`, `:138` |
| Teste primeiro: 401 / 403 / 200 / rebaixado | atendido | `roles.e2e-spec.ts:83-116` |
| Arquivos previstos | atendido. A Tarefa 2 mexeu só em `roles.decorator.ts`, `roles.guard.ts`, `auth.module.ts` e `roles.e2e-spec.ts`. | `git status` |

## Apontamentos
Nenhum bloqueante.

## Observações (não bloqueantes)
- Escopo: nada além do previsto. `jwt-auth.guard.ts` (campo `role` no `request.user`), `auth.controller.ts`, o DTO, o repository, o schema e a migration pertencem à Tarefa 1 e não foram reavaliados.
- O teste extra "rota @Public com @Roles não é barrada" e o ramo `@Public` do guard (`roles.guard.ts:20-22`) são defensivos. Não estão no texto da tarefa e não há critério que os peça. Não os considero escopo inflado, porque o guard global precisa ignorar rotas públicas para não quebrar login e cadastro.
- Os testes com `@Roles(CUSTOMER)` e "rota sem `@Roles`" cobrem comportamento do guard além do mínimo da tarefa, sem violar nenhum CA.
- O `RolesProbeController` só existe no teste, não entra no `AppModule`. Nenhuma rota de produção foi criada.
- O aviso de CRLF em `auth.module.ts` é só de fim de linha, sem impacto.
