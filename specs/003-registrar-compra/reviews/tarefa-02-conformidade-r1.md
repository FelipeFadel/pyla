# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 (parcial: só o caminho de produto novo): 201, compra CONFIRMED, itens gravados | atendido | `purchases.repository.ts:20-62`; e2e `purchases-create.e2e-spec.ts:75-111` |
| CA3: produto novo com `name` + `categoryId` fixa, criado para o usuário na mesma transação | atendido | `purchases.repository.ts:25-42` (`$transaction`); e2e `:108-110` confere `userId`, `categoryId` e `normalizedName` |
| CA8: sem loja, aceita, `store` nula | atendido | `purchases.service.ts:53-55`; e2e `:87` e `:106` |
| CA16: `userId`, `status` ou `confirmedAt` no corpo dão 400 e nada é gravado | atendido | e2e `:113-132` (`it.each` com os 3 campos, confere 0 compras e 0 produtos). O DTO não tem esses campos, então a rejeição vem do pipeline global (`configureApp`). O texto da tarefa pede 400 e foi isso que se implementou. |
| CA22, só em POST /purchases: 401 sem sessão | atendido | e2e `:134-139`; a rota fica sob o guard global, sem `@Public` |
| Unitário de `purchase-calculations.ts` para a soma dos itens | atendido | `purchase-calculations.spec.ts:52-65` (soma com desconto e lista vazia) |
| `normalize-name.ts` e `.spec.ts` (arquivo previsto) | atendido | 4 casos: pontas, espaços internos, acentos, só espaços |
| `app.module.ts` registra `PurchasesModule` | atendido | diff do `app.module.ts` |
| CA2, CA4–CA7, CA9–CA15, CA17–CA21, CA23, CA24 | fora desta tarefa | o plan.md os deixa para as tarefas 3 a 6 |

Testes rodados:
- `npm test`: 3 arquivos, 12 testes, todos passaram.
- e2e `test/purchases-create.e2e-spec.ts`: 5 testes, todos passaram.

## Apontamentos
Nenhum.

Observações, sem bloqueio:
- `itemFullValueCents` e `itemValueCents` já tratam `discountCents`, e a resposta já traz `itemsTotalCents` e `totalCents`. Isso é o mínimo para a soma dos itens e para o corpo do 201 que o teste verifica. O desconto de caixa ficou como `TODO #3` na tarefa 5, sem inflar o escopo.
- A validação de data (futura ou inválida), a verificação de que a categoria é fixa e os limites de tamanho não existem ainda. Isso é esperado, porque são CA4, CA13 e CA14 das tarefas seguintes.
