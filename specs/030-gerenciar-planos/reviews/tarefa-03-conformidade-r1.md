# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

Rodei o e2e uma vez, sem processos em paralelo: 10 arquivos e 86 testes passaram. `npm test` passou (1 teste) e o lint saiu sem achados.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2: admin cria, 201, ativo, nome sem espaços nas pontas | atendido | `create-plan.dto.ts:22-24` (Transform trim); `plans.service.ts:12-26`; teste `plans-create.e2e-spec.ts:55` |
| CA3 (criação): nome vazio, só espaços, maior que 60, ausente ou não texto; preço não numérico, 0, negativo, maior que 9999.99, com 3 casas; 400 com o campo; nada gravado | atendido | `create-plan.dto.ts:25-44`; `plans-create.e2e-spec.ts:102-152` (16 casos mais campo extra, todos conferem `details.field` e `plan.count() === 0`) |
| CA4 (criação): mesmo nome ignorando maiúsculas e espaços, 409, mensagem e campo `name`, nada gravado | atendido | `plans.service.ts:16,27-35`; teste `plans-create.e2e-spec.ts:154-175`, que também checa que não vaza P2002, prisma, constraint ou namekey |
| CA5: duas criações simultâneas, um 201 e um 409 com a recusa do CA4 | atendido | `schema.prisma` `nameKey @unique`; o service captura P2002 sem checagem prévia; teste `plans-create.e2e-spec.ts:177` com `Promise.all` |
| CA13 (em POST /plans): cliente recebe 403, nada gravado | atendido | `plans.controller.ts:22` (`@Roles(Role.ADMIN)`); teste `plans-create.e2e-spec.ts:191` |
| CA14 (em POST /plans): sem sessão recebe 401 | atendido | teste `plans-create.e2e-spec.ts:200` |
| Plan e Subscription mínimos (`planId` com onDelete Restrict, `priceCents` contratado; preço em reais na API e centavos no banco) | atendido | `schema.prisma`; `plans.service.ts:17,22` |
| Sem vazamento de `nameKey` ou `priceCents` | atendido | O retorno do service (`plans.service.ts:19-26`) lista os campos à mão: id, name, price, active, createdAt, updatedAt. Teste `plans-create.e2e-spec.ts:93` e `toEqual` exato em `:61`. |
| Nenhuma rota de produção cria Subscription | atendido | Nenhuma ocorrência de "subscription" em `apps/api/src` fora de `generated/`. O PlansRepository só tem `create` de plan. |
| Migration só cria o previsto | atendido | `migration.sql`: CREATE TABLE Plan e Subscription, índices únicos `Plan_nameKey_key` e `Subscription_userId_key`, 2 FKs com RESTRICT. Não há DROP, ALTER de User nem dado alterado. |
| Escopo: nada fora da Tarefa 3 alterado | atendido | Os arquivos da Tarefa 3 são schema, migration, `src/plans/*`, `app.module.ts` e o teste. O resto do working tree é das Tarefas 1 e 2, que não revisei. O `schema.prisma` também traz `Role` e `User.role`, da Tarefa 1. |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- A unicidade usa `toLowerCase()` sem normalização Unicode. "É" e "é" colidem, mas "e" e "é" não, o que está de acordo com a spec ("sem diferenciar maiúsculas").
- `Subscription.userId` é `@unique`, ou seja, uma assinatura por usuário. É uma escolha do modelo mínimo, marcada com `TODO #7`, e não afeta esta tarefa.
- Os testes extras de campo extra no corpo (400 por whitelist) e de conversão para centavos sem erro de ponto flutuante vão além da spec, mas só reforçam critérios existentes e não adicionam comportamento.
- `plan-response.dto.ts` não tem `@ApiProperty` nos campos. Isso é detalhe de Swagger e fica para o revisor de código.
