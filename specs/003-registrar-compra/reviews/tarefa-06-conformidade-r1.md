# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

Rodei `npm test`: 15/15 passaram. Rodei `purchases-validation.e2e-spec.ts`: 60/60 passaram.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA4: categoria inexistente ou não fixa dá 400 em `items.N.categoryId`, nada gravado | atendido | `purchases.service.ts` (`findFixedCategoryIds` com `ownerId: null` e checagem por item); `purchases.repository.ts:27`; e2e `categoria (CA4)`, com os casos inexistente, personalizada e índice 1 |
| CA13: `fullPriceCents` ≤ 0, `quantity` ≤ 0, `packageSize` ausente ou ≤ 0, `unit` inválida | atendido | `create-purchase.dto.ts:68-102`; e2e `itens (CA13)` |
| CA13: nome vazio ou só espaços, e nome de produto > 80 | atendido | `create-purchase.dto.ts:51-58` (trim, `IsNotEmpty`, `MaxLength`) |
| Limite: nome de loja ≤ 80 | atendido | `create-purchase.dto.ts:144`; e2e `loja` (81 recusa, 80 aceita) |
| Limite: 100 itens | atendido | `ArrayMaxSize(100)`; e2e (100 aceitos, 101 dá 400 em `items`) |
| Limite: `fullPriceCents` ≤ 10.000.000 | atendido | `@Max(PRICE_MAX_CENTS)`; e2e testa 10.000.001 e o limite exato |
| Limite: `quantity` ≤ 9999,999 e `packageSize` ≤ 99999,999 | atendido | `@Max`; e2e testa 10000, 100000 e os valores exatos |
| Limite: no máximo 3 casas decimais | atendido | `IsMilliNumber`; e2e testa 1.2345, 0.0001, 1e-7 e 1e21 |
| CA13: nada gravado (compra, itens, produto, loja) | atendido | todas as validações rodam antes de `createConfirmed`; `nadaGravado()` confere os 4 contadores; há caso com loja nova e item válido seguido de inválido |
| CA14: data futura ou formato inválido dá 400 em `date` | atendido | `purchases.service.ts` (`isRealDate`, comparação com `dateInSaoPaulo`); e2e `data (CA14)` |
| CA14: a data de hoje é aceita, com relógio fixado perto da meia-noite de São Paulo | atendido | `clock.ts`; e2e com 23:59 e 00:01 de São Paulo, usando `overrideProvider(Clock)` |
| CA15: `items` vazio ou ausente dá 400 | atendido | `ArrayNotEmpty` e `IsArray`; e2e (`[]`, ausente, null, texto, elementos não objeto) |

## Itens extras
Nenhum infla o escopo. Todos servem a CA13, CA14 ou à regra "entrada malformada nunca vira 500".
- **storeName ≤ 80:** a linha 64 da spec manda "nome de produto **e de loja** até 80". Está no escopo.
- **NUL, surrogate solto e normalizedName vazio:** são entradas que o Postgres recusa ou que quebrariam a unicidade por `normalizedName`. São o caso "nome vazio" do CA13 levado até o fim.
- **Data inexistente (2026-02-30) e ano ≥ 1900:** o primeiro é "formato inválido" do CA14. O piso de 1900 não está na spec, mas é uma guarda contra 500 (ano 0000). Anotação não bloqueante: ele recusa datas anteriores a 1900, que não são realistas.
- **`IsMilliNumber`:** é o meio de cumprir o limite de 3 casas sem 500, porque o `maxDecimalPlaces` do class-validator estoura com 1e-7. Há teste cobrindo esse caso.
- **XOR productId/storeId com `field` no corpo:** só normaliza para o formato de erro com índice e campo que o CA13 exige. Os dois e2e passam.
- **Categoria checada no repository:** é a única forma de provar "existe e é fixa" antes de gravar. A mesma consulta serve a todos os itens, sem N consultas.

## Apontamentos
Nenhum bloqueante.

Observação para o revisor de código, fora desta revisão: `MaxLength` conta unidades UTF-16, então um emoji conta como 2. Não afeta o critério.
