# Parecer de Conformidade — Tarefa 3 (rodada 2)

**Veredito:** APROVADO

Rodei `npm test`: 12/12 passaram. Rodei o e2e `purchases-products.e2e-spec.ts`: 9/9 passaram. Não rodei o e2e completo, como pedido.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2: `productId` do usuário reaproveita e não cria outro | atendido | `purchases.repository.ts` (`findFirst` por id + userId); teste e2e linha 89 |
| CA2: nome igual, sem diferenciar maiúsculas nem espaços, reaproveita | atendido | `createMany` com `skipDuplicates` e `findUniqueOrThrow` por `userId_normalizedName`; teste e2e linha 100 (`'  FEIJAO   Preto '`) |
| CA5: `productId` inexistente dá 404 e nada é gravado | atendido | `NotFoundException` dentro da transação; teste e2e linha 111 (inclui um produto novo antes, e confirma 0 compras e 0 produtos, ou seja, rollback) |
| CA5: `productId` de outro usuário dá 404 e nada é gravado | atendido | `findFirst` filtra por `userId`; teste e2e linha 124 |
| CA6: mesmo produto novo em dois itens gera um só produto | atendido | `byName`/`firstByName` resolve cada nome uma vez; teste e2e linha 136 |
| CA6: duas compras simultâneas com o mesmo produto novo deixam um só produto | atendido | `ON CONFLICT DO NOTHING` na unicidade do banco, com ordem fixa de chaves; teste e2e linha 149 (dois 201, 1 produto, 2 compras) |
| Mudança desta rodada: `productId: null` dá 400 | atendido | `@ValidateIf(productId !== undefined)` + `@IsUUID` no DTO; teste e2e linha 172 (400, 0 compras, 0 produtos) |

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: a recusa com 400 de `productId` junto com `name` ou `categoryId` (`purchases.service.ts`, teste e2e linha 182) não está nos CAs. É uma regra de entrada defensiva, não altera nenhum critério e não inflou o escopo para loja, desconto ou validações da tarefa 6. Fica a seu critério mantê-la ou não.
