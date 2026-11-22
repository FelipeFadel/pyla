# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

Testes rodados: `npm test` passou 3 arquivos e 12 testes. `purchases-store.e2e-spec.ts` passou 14 de 14.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7: `storeId` de loja do usuário liga a compra a ela | atendido | `purchases.repository.ts:35-40`; teste `purchases-store.e2e-spec.ts:88` (confere `store` na resposta, `storeId` gravado e nenhuma loja nova) |
| CA7: `storeName` cria a loja quando ela não existe | atendido | `purchases.repository.ts:41-61`, `purchases.service.ts:24-29`; teste linha 101 |
| CA7: `storeName` reaproveita a loja existente, sem diferenciar maiúsculas nem espaços, sem duplicar | atendido | `normalizeName` mais `userId_normalizedName` e `skipDuplicates`; testes linhas 115 (`'  MERCADO   Bom '` reaproveita `'mercado bom'`), 126 (outro usuário não conta) e 139 (corrida) |
| CA9: `storeId` inexistente ou de outro usuário dá 404 e nada é gravado | atendido | `findFirst` com filtro por `userId`, `NotFoundException`, dentro da transação (`purchases.repository.ts:36-39`); testes linhas 152 e 164 (sem compra nem produto, loja alheia intacta) |
| CA8 (regressão): sem loja, `store` nula | atendido | teste linha 205 |
| Resposta com `store` | atendido | `include store` em `purchases.repository.ts:128` |

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: a rejeição com 400 quando `storeId` e `storeName` chegam juntos (`purchases.service.ts:16-20`) e a validação 400 de `storeId` não-UUID e `storeName` vazio não estão literalmente no texto da tarefa. São coerentes com o "OU" do CA7 e com o "tudo ou nada" do CA13. Os testes cobrem ambos e deixam a lista de lojas vazia. Não considero escopo inflado.
