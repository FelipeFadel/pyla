# Parecer de Código — Tarefa 3

**Veredito:** APONTAMENTOS

`npm test` em `apps/api` passou (12/12). Não rodei e2e, como combinado. O apontamento 1 vem de leitura do código, não de execução.

## Apontamentos (bloqueiam)

1. **`productId: null` passa pela validação e vira erro 500 do Prisma.** `apps/api/src/purchases/dto/create-purchase.dto.ts` (`@IsOptional()` em `productId`), `apps/api/src/purchases/purchases.service.ts` (checagem `item.productId === undefined`) e `apps/api/src/purchases/purchases.repository.ts` (`tx.product.findFirst({ where: { id: item.productId, … } })`).
   - Passo a passo com `{"productId": null, "quantity": 1, …}`:
     - `@IsOptional` ignora `null`, então o campo é aceito.
     - O `@ValidateIf` de `name` e `categoryId` só dispara com `productId === undefined`, então `null` os dispensa.
     - No service, `null !== undefined` e `name` e `categoryId` estão ausentes, então ele monta `{ productId: null }`.
     - No repository, `'productId' in item` é verdadeiro e o Prisma recebe `id: null` num campo não anulável.
   - Regra violada: architecture.md §2.1 "Entrada da API (ID7)": "Requisição malformada é recusada antes do service, sem efeito colateral". §2.1 "Formato de resposta e de erro": exceção do Prisma não prevista vira 500 genérico.
   - Prejuízo concreto: um cliente que mande `null` em vez de omitir o campo recebe 500 em vez de 400. Não há teste cobrindo isso. A correção é tratar `null` como ausente no DTO (por exemplo, trocar `@IsOptional()` por `@ValidateIf` que cubra `null`, ou usar `IsDefined`).

## Sugestões (não bloqueiam)

- **Exclusividade `productId` XOR `name`/`categoryId` no service.** Hoje ela fica em `purchases.service.ts`, dentro do `map`, e lança `BadRequestException` manual. Uma regra de formato de entrada caberia no DTO, que é onde o architecture.md coloca a validação. O plano aceita `BadRequestException` no service para regras de negócio, então não bloqueio.
- **`NotFoundException` lançada no repository** (`purchases.repository.ts`). O architecture.md não proíbe exceção HTTP lá, e lançar dentro da transação é o que garante o rollback. Mesmo assim, uma exceção de domínio ou o service traduzindo o erro deixaria o repository livre de HTTP.
- **Dedup por `normalizedName`**: `[...newItems].reverse().map(...)` para a primeira ocorrência vencer é correto, mas obscuro. Um `if (!map.has(key)) map.set(...)` diz a mesma coisa.
- **`createMany` com um único elemento.** Está certo por causa do `skipDuplicates`, e o comentário explica. Vale citar no comentário que `create` não serviria porque o `P2002` aborta a transação no Postgres.
- **N consultas de `findFirst` por item com `productId`.** Pode virar uma `findMany` com `id: { in: … }`. É otimização, sem prejuízo hoje.
- **Teste de concorrência (CA6)** depende de agendamento real e hoje passa. Se ficar intermitente, é o primeiro suspeito.
- **Helper de teste `produtoDe`** repete `trim().toLowerCase()` em vez de usar `normalizeName`, então diverge se a normalização mudar.
- **Decisões do implementador avaliadas:**
  - `createMany({ skipDuplicates })` seguido de leitura: adequada.
  - Ordem alfabética para evitar deadlock: adequada.
  - `afterAll` de limpeza no e2e: adequado, pelo comentário da FK `Restrict`.

## Observações fora do escopo deste diff

- O plano (decisões técnicas, em `specs/003-registrar-compra/plan.md`) ainda descreve tratar `P2002` relendo o produto. A implementação adotou `skipDuplicates`. Convém atualizar o texto do plano, mas só o usuário decide isso.
