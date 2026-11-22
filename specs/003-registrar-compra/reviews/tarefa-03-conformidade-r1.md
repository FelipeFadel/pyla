# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

Testes rodados: `npm test` passou (12/12) e `purchases-products.e2e-spec.ts` passou (8/8).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2 — reaproveita por `productId` | atendido | purchases.repository.ts (ramo `'productId' in item`, `findFirst` filtrando por userId); teste e2e linha 89 |
| CA2 — reaproveita por nome (maiúsculas e espaços) | atendido | `normalizeName` no service, `createMany` com `skipDuplicates` e depois `findUniqueOrThrow` por `userId_normalizedName` no repository; teste e2e linha 100 (`'  FEIJAO   Preto '` reaproveita `feijao preto`, 1 produto) |
| CA5 — `productId` inexistente ou de outro usuário dá 404 e nada é gravado | atendido | `NotFoundException` dentro da transação, o que desfaz a compra e os produtos novos; testes e2e linhas 111 e 124. O primeiro teste inclui um item novo antes do inválido e confirma 0 produtos e 0 compras. |
| CA6 — mesmo produto novo em dois itens da mesma compra | atendido | `byName` resolve cada nome uma vez; teste e2e linha 136 (mesmo `product.id` nos dois itens, 1 produto) |
| CA6 — duas compras simultâneas com o mesmo produto novo | atendido | unicidade do banco com `ON CONFLICT DO NOTHING`; teste e2e linha 149 (`Promise.all`, ambas 201, 1 produto, 2 compras) |
| Escopo: sem loja, desconto ou validações da tarefa 6 | atendido | O diff não toca em loja, desconto nem `paidTotal`. |

## Sobre a nota do plan (P2002 versus `createMany` com `skipDuplicates`)
A abordagem cumpre o CA6. A spec exige que a unicidade `userId` + `normalizedName` no banco decida a corrida, "não por checagem que poderia perder a corrida" (seção Abandono no meio). `ON CONFLICT DO NOTHING` é exatamente isso. A inserção concorrente espera o commit da outra transação, não faz nada, e a leitura seguinte (isolamento padrão READ COMMITTED, sem isolamento customizado no `$transaction`) enxerga o produto vencedor. Tratar P2002 dentro da transação do Postgres a abortaria, então a escolha do implementador é correta. A ordem fixa (`sort()`) evita deadlock. O teste de concorrência passou.

## Apontamentos
Nenhum bloqueante.

Observações não bloqueantes, só para o usuário saber:
- O service e o teste rejeitam com 400 um item que traz `productId` junto com `name` ou `categoryId` (service, `BadRequestException`; teste e2e linha 172). A spec não pede isso. É um detalhe pequeno e defensivo que não contradiz nenhum CA, mas é comportamento não especificado. O usuário pode decidir se mantém.
- Um `productId` que não é UUID retorna 400 (`@IsUUID`), e não 404. O CA5 fala em "não existe", e um id malformado não é UUID válido. Dá para manter.
