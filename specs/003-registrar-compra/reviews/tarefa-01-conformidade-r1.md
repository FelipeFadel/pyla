# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA21 — usuário autenticado recebe as categorias fixas em ordem alfabética | atendido | `apps/api/src/categories/categories.repository.ts` (`where ownerId null`, `orderBy name asc`, `select id/name`); `categories.controller.ts` (`GET /categories`) |
| CA21 — as 10 categorias do seed são as da dúvida 2 da spec | atendido | seed no fim de `apps/api/prisma/migrations/20261122165708_add_purchase_model/migration.sql` (10 nomes idênticos) |
| CA22 (em GET /categories) — sem sessão dá 401 | atendido | não há `@Public` na rota; teste `sem sessão: 401 (CA22)` em `apps/api/test/categories-list.e2e-spec.ts` |
| Modelo de compra criado (Purchase, PurchaseItem, Product, Store, Category, enums) | atendido | `apps/api/prisma/schema.prisma`: dinheiro em `...Cents` Int, decimais `Decimal(12,3)`, `unique(userId, normalizedName)` em Product e Store, `status` com DRAFT/CONFIRMED, `Unit` com KG/G/L/ML/UNIT |
| Teste prova o critério | atendido | O teste e2e compara a lista exata dos 10 nomes em ordem, `length` 10, e `Object.keys` igual a `['id','name']` com `id` string |
| Escopo (arquivos previstos) | atendido | Só foram tocados schema, migration, `src/categories/*`, `app.module.ts` e o e2e. Nenhuma rota de compra, produto ou loja foi criada antes da hora. |

## Testes
- `npm test`: 1 de 1 passou.
- `categories-list.e2e-spec.ts` rodado isolado: 2 de 2 passaram.
- `npm run test:e2e` completo: houve falhas em `auth-register`, `plans-create`, `plans-update` e `plans-delete` (37 falhas na primeira rodada, 49 na segunda).
  - `auth-register.e2e-spec.ts` rodado isolado passa 20 de 20.
  - O resultado muda de uma rodada para outra, e nenhum desses arquivos toca em categorias. Isso aponta para interferência no banco compartilhado (outro processo de teste em paralelo), não para esta tarefa.
  - Recomendo rodar o e2e completo uma vez com o banco livre antes de fechar a tarefa.

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: o `schema.prisma` traz `Category.ownerId` e `User.categories` para categoria personalizada (US11). É necessário para o filtro "fixa = ownerId nulo" e consta no architecture, então não conta como escopo inflado.
