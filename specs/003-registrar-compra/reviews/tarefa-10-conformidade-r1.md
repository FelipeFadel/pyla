# Parecer de Conformidade — Tarefa 10

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA23: dois usuários com compras, produtos e lojas; listagem, detalhe e busca sem dado do outro (RN21) | atendido | `apps/api/test/purchases-isolation.e2e-spec.ts:73-102` (cenário), `:125` (lista), `:146` (detalhe), `:179` (busca) |
| Produto de mesmo nome dos dois é distinto (Tarefa 10) | atendido | `purchases-isolation.e2e-spec.ts:104`: 2 produtos "arroz", ids distintos e userId distintos. Também confere a loja "Mercado Comum" duplicada em dois registros. |
| POST com `productId` ou `storeId` alheio dá 404 e nada é gravado (Tarefa 10) | atendido | `purchases-isolation.e2e-spec.ts:218` e `:253`. Comparam as contagens antes e depois. |
| CA24: todas as rotas da história aparecem | atendido | `apps/api/test/swagger.e2e-spec.ts:83-89` e `:136`. As 5 rotas são GET /categories, GET /products, GET /purchases, POST /purchases e GET /purchases/{id}. Cada uma exige `summary`. |
| CA24: campos dos DTOs de entrada e de saída | atendido | `swagger.e2e-spec.ts:32-81` e `:202`. Cada schema é comparado por igualdade exata com a lista de campos. |
| Tipos documentados correspondem aos reais | atendido | Veja a verificação abaixo. |
| `@ApiProperty` acrescentados só documentam | atendido | Veja a verificação abaixo. |

### Verificação do swagger
- **Entrada:** comparei as listas do teste com as classes reais. `CreatePurchaseDto` tem 5 campos e `CreatePurchaseItemDto` tem 8. As listas coincidem com `create-purchase.dto.ts`.
- **Saída:** `PurchaseDto`, `PurchaseItemDto`, `PurchaseItemProductDto`, `PurchaseItemCategoryDto`, `PurchaseStoreDto`, `PurchaseSummaryDto`, `ProductSummaryDto`, `ProductCategoryDto`, `CategoryDto` e os envelopes coincidem com as classes reais. Não achei campo de DTO ausente do teste nem do documento.
- **Cobertura dos schemas:** o teste "schemas alcançáveis" (`:189`) exige que o conjunto de schemas alcançável a partir das rotas seja exatamente igual ao esperado. Um DTO novo ou esquecido derruba o teste.
- **Decorators obrigatórios:** o vitest não carrega o plugin do `@nestjs/swagger` (ele só roda no `nest build`). Por isso o teste prova de verdade que cada campo tem `@ApiProperty`.
- **Tipos:**
  - `store` está com `nullable: true`, `unit` com `enum: Unit` e `status` com enum `DRAFT`/`CONFIRMED`. Esses três já existiam.
  - Dinheiro, quantidade e `packageSize` estão como `Number`. Id como `String uuid`. Datas como `String`.
  - `items` e `data` estão como arrays.
- **Só documentação:** o diff dos DTOs de resposta só acrescenta `@ApiProperty` e o import de `ApiProperty`. Não há mudança de lógica nem de contrato. Esses DTOs não têm validadores.

### Testes
- `npm test`: 15/15 passam.
- Os dois arquivos e2e da tarefa: 26/26 passam.

## Apontamentos
Nenhum bloqueante.

Observações não bloqueantes, que não reprovam:
- **`@Query search`:** o teste checa que `search` existe como query em GET /products. Não checa o parâmetro de path `id` de GET /purchases/{id}. A CA24 pede só rotas e campos dos DTOs, então isso é opcional.
- **Garantia por rota:** a CA22 só vale por rota no teste de isolamento e nos testes das tarefas anteriores. Isso está fora desta tarefa.
