# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

Rodei os testes uma vez, sem outros processos em paralelo:
- `npm run test:e2e -w apps/api`: 11 arquivos e 95 testes passaram. Os logs de erro no fim da saída vêm de `base-global.e2e-spec.ts`, que provoca o erro de propósito.
- `npm test -w apps/api`: 1 de 1 passou.
- `npm run lint -w apps/api`: sem avisos.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 (API): admin vê ativos e inativos com nome, preço e estado, em ordem alfabética | atendido | `apps/api/src/plans/plans.controller.ts:63-92`, `plans.service.ts:32-35`, `plans.repository.ts:13-15`, teste em `apps/api/test/plans-list.e2e-spec.ts:58-93` |
| CA1: sem planos, lista vazia (`{ data: [] }`) | atendido | `plans-list.e2e-spec.ts:95-102` |
| CA9: autenticado recebe só os ativos, com nome e preço, nenhum inativo | atendido | `plans.controller.ts:95-118`, `plans.service.ts:37-44`, `plans.repository.ts:17-22`, teste em `plans-list.e2e-spec.ts:131-165` |
| CA13: cliente recebe 403 em `GET /plans` | atendido | `@Roles(Role.ADMIN)` em `plans.controller.ts:64`, teste em `plans-list.e2e-spec.ts:115-122` |
| CA13: `GET /plans/available` aberta a qualquer autenticado | atendido | Sem `@Roles` na rota. Cliente e admin são testados em `plans-list.e2e-spec.ts:149-155`. |
| CA14: sem sessão dá 401 nas duas rotas | atendido | `plans-list.e2e-spec.ts:124-128` e `167-171` |
| Ordem alfabética sem diferenciar maiúsculas | atendido | `plans.repository.ts:14` e `:20` ordenam por `nameKey` (o nome em minúsculas). O teste mistura `banana`, `Abacaxi` e `cereja`. |
| Inativos só aparecem em `GET /plans` | atendido | `findAllActive` filtra `active: true`. O teste inclui um inativo em `/plans/available`. |
| Nada vaza `nameKey` ou `priceCents` | atendido | `toDto` (`plans.service.ts:46-62`) mapeia campo a campo. O teste de vazamento em `plans-list.e2e-spec.ts:104-113` confere os dois campos, e o `toEqual` do CA1 fixa as chaves exatas. |
| Refactor de `create` para usar `toDto` mantém o POST igual | atendido | `plans.service.ts:19`. O formato de resposta é o mesmo, e `plans-create.e2e-spec.ts` continua verde. |
| Nada fora do escopo da Tarefa 4 alterado | atendido | Os GET, `findAll`, `findAvailable`, `toDto`, `findAll` e `findAllActive` no repositório, os DTOs novos e `plans-list.e2e-spec.ts` são da Tarefa 4. O resto do diff pertence às Tarefas 1 a 3, que o prompt mandou não rever. Não houve rota nova além dos dois GET. |
| Rota estática `available` registrada sem conflito com `:id` | atendido | `plans.controller.ts:94-95`. Não existe rota `:id` ainda. |

## Apontamentos bloqueantes
Nenhum.

## Observações (não bloqueantes)
- `GET /plans/available` devolve também `id`, além de nome e preço. A spec pede "nome e preço", mas o `id` é o identificador que a assinatura futura (US06) vai precisar. O teste fixa `{ id, name, price }`. Não considero escopo inflado, mas vale o usuário confirmar.
- A ordenação usa `orderBy nameKey asc` no banco. `nameKey` vem de `toLowerCase()` em JS, e o resultado depende do collation do Postgres. Para os nomes dos testes está correto. Com acentos ou pontuação, a ordem pode divergir da expectativa. Isso é desempenho e organização, então fica para o revisor de código ou para uma issue futura.
- O estado vazio que "convida a criar o primeiro plano" (CA1) é do front. Está fora da Tarefa 4, que cobre só a API.
- Não rodei `git add` nem commit, e não alterei nenhum arquivo.
