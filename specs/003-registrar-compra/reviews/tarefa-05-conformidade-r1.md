# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10: `discountCents` entre 0 e o valor cheio é aceito, com padrão 0 | atendido | `create-purchase.dto.ts` (`@Min(0)`, opcional); `purchases.service.ts:43-51`; e2e `purchases-discounts.e2e-spec.ts:86-111` |
| CA10: fora do intervalo dá 400 com item e campo (`items.N.discountCents`), sem gravar nada | atendido | negativo pelo DTO; maior que o valor cheio pelo service (`invalidField("items.${index}.discountCents")`, antes de `createConfirmed`). e2e `:127-161` cobre o índice 1 e `nadaGravado()` |
| CA10: limite usa `round(fullPriceCents × quantity)`, meio-centavo para cima | atendido | `purchase-calculations.ts:14-17` (milésimos inteiros, sem float). Unitários `.spec.ts:17-39`. e2e `:113-125` (333 × 1,5 = 500 aceito, 501 recusado) |
| CA10: borda desconto = valor cheio | atendido | e2e `:86` (1000 aceito, valor do item 0); `:118` (500 aceito, valor 0) |
| CA11: `paidTotalCents` entre 0 e a soma com descontos é aceito e a resposta traz `cashDiscountCents` | atendido | `purchases.service.ts:132-136`; e2e `:163-178` (0, 1, 700 e 1000) e `:180-197` (soma já com desconto: 700 aceito, 701 recusado) |
| CA11: fora do intervalo dá 400 com o campo `paidTotalCents`, sem gravar nada | atendido | negativo pelo DTO; maior que a soma pelo service (`:52-65`). e2e `:199-214` com `nadaGravado()` |
| CA12: sem `paidTotalCents`, desconto de caixa 0 e total igual à soma | atendido | `purchase-calculations.ts:29-41`; unitário `.spec.ts:55-58`; e2e `:216-227` (também confere `paidTotalCents` nulo no banco) |
| Teste unitário de valor cheio, valor com desconto, desconto de caixa e total | atendido | `purchase-calculations.spec.ts` |

Testes rodados: `npm test` deu 15/15 e `purchases-discounts.e2e-spec.ts` deu 25/25.

## Apontamentos
Nenhum.

Observações não bloqueantes:
- O `@Max(2147483647)` em `discountCents` e `paidTotalCents` não está no texto de CA10 nem de CA11. É uma proteção contra 500 por estouro do Int do Postgres, o código comenta isso e deixa o limite de preço para a tarefa 6. Isso não reprova. O e2e cobre o caso e devolve 400 no campo certo.
- O 400 dos limites que dependem de outros campos sai com o mesmo formato do ValidationPipe (`details: [{field, messages}]`). Os e2e só conferem que o nome do campo aparece no corpo, não a estrutura exata. O requisito "indica item e campo" fica atendido.
