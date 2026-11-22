# Plano — Issue #3

## Decisões técnicas

- **Entidades novas** (as do `architecture.md` §5.1, já com centavos): `Category` (`ownerId` nulo = fixa), `Store` (`userId`, `name`, `normalizedName`, único por `userId` + `normalizedName`), `Product` (`userId`, `name`, `normalizedName`, `categoryId`, único por `userId` + `normalizedName`), `Purchase` (`userId`, `storeId?`, `date` como `@db.Date`, `status`, `paidTotalCents?`, `confirmedAt?`, `updatedAt`) e `PurchaseItem` (`purchaseId`, `productId`, `quantity` e `packageSize` `Decimal(12,3)`, `unit`, `fullPriceCents` e `discountCents` `Int`). Enums `PurchaseStatus { DRAFT, CONFIRMED }` e `Unit { KG, G, L, ML, UNIT }`. Relação **1:N Purchase → PurchaseItem** com `onDelete: Cascade`; as demais com `Restrict`. `latitude` e `longitude` de `Store` ficam de fora (nada os usa; TODO na localização).
- **Seed das categorias fixas** dentro da migration, em SQL (`INSERT` com `gen_random_uuid()`), as 10 da spec. Assim o banco de teste e o de produção já nascem com elas. **Ler o SQL gerado antes de commitar.**
- **Módulos** (controller → service → repository): `categories` (`GET /categories`), `products` (`GET /products?search=`) e `purchases` (`POST /purchases`, `GET /purchases`, `GET /purchases/:id`). Loja não tem rota: só é criada por `purchases`. Todas as rotas sob o `JwtAuthGuard` global, sem `@Roles`.
- **Gravação numa transação só.** `PurchasesRepository.createConfirmed` abre um `$transaction` e dentro dele resolve as lojas e os produtos (acha ou cria) e grava a compra com os itens. Qualquer falha desfaz tudo (CA13). A corrida do CA6 se resolve pela unicidade no banco: o erro `P2002` de `createMany`/`create` dentro da transação é tratado relendo o produto que o outro envio criou, não com checagem prévia. Produtos repetidos dentro da mesma compra são resolvidos uma vez por `normalizedName`.
- **Regras puras fora do banco.** Um arquivo `purchase-calculations.ts` (sem Nest, sem Prisma) com o valor cheio do item (`round(fullPriceCents × quantity)`, meio-centavo para cima), o valor com desconto, a soma dos itens, o desconto de caixa e o total. O service valida contra ele; o response DTO usa o mesmo. Teste unitário próprio, com os arredondamentos.
- **Normalização do nome** (`normalizedName`, de produto e de loja): sem espaços nas pontas, em minúsculas, espaços internos repetidos viram um. Uma função só, em `common/`. A busca de produtos (CA20) compara também sem acento, então `normalizedName` é gravado sem acento (`NFD` e remoção das marcas); o nome original fica em `name`.
- **Contrato.** Corpo do `POST /purchases`: `date` (`YYYY-MM-DD`), `storeId?`, `storeName?`, `paidTotalCents?`, `items[]` com `productId?` ou `name` + `categoryId`, `quantity`, `packageSize`, `unit`, `fullPriceCents`, `discountCents?`. O `ValidationPipe` global tem `forbidNonWhitelisted: true`: um corpo com `userId`, `status` ou `confirmedAt` volta **400** e nada é gravado. Isso difere do texto do CA16 ("não têm efeito"), como no CA15 da US15: o teste prova o essencial (nunca existe compra de outro usuário nem rascunho por esse caminho). Ponto para o usuário em *Pontos para o usuário*.
- **Erro com índice do item.** Validação aninhada (`@ValidateNested` + `@Type`) já aponta `items.2.quantity` na mensagem do 400; o teste confere esse caminho. Recusas de regra no service (categoria, desconto, total, data) usam `BadRequestException` com o mesmo formato (`items.0.discountCents`).
- **Data de hoje** em `America/Sao_Paulo`, calculada por `Intl.DateTimeFormat` numa função injetável (relógio substituível no teste, para não depender do dia em que a suíte roda).
- **404 sem vazamento.** Compra, produto e loja de outro usuário dão a mesma resposta de "não existe": o repository sempre filtra por `userId`.
- **Filtro do RN07.** Toda leitura de compra filtra `status = CONFIRMED`, mesmo sem rascunho existir hoje (`architecture.md` §5.1), para a US de rascunho não precisar caçar consultas.
- **Swagger.** `@ApiTags`, `@ApiProperty` em todos os DTOs de entrada e saída, e `@ApiBearerAuth` seguem o padrão de `plans`.
- **Documentação (Passo 4, não é tarefa de código).** `architecture.md` ganha as rotas na §6 e o que mudou no ER; `prd.md` e `specs/README.md` mudam o estado conforme a decisão do usuário sobre o que a história ainda não entrega (ver abaixo).

## Pontos para o usuário

- **CA16 × `forbidNonWhitelisted`.** Se prefere o texto do CA16 ao pé da letra (campo extra ignorado), é preciso mudar o pipe global, o que mexe em todas as rotas. Recomendo manter o 400 e reescrever o CA16 ("é recusado com 400 e nada é gravado"). Só o usuário altera a spec aprovada.
- **Dúvidas em aberto da spec.** A tabela ainda tem as 4 linhas, já respondidas. Convém apagá-las num commit de ajuste.
- **Status da US02 no PRD.** Com rascunho, base coletiva e localização fora, a US02 não fica completa ao fim da Issue. Decidir no Passo 4 se ela vai a `Live` ou se fica `Ready` até as Issues novas.

## Tarefas

- [x] **Tarefa 1 — Criar o modelo de compra e listar as categorias fixas**
  - Cobre: CA21, CA22 (em `GET /categories`)
  - Teste primeiro: e2e do `GET /categories`: usuário autenticado recebe as 10 categorias fixas em ordem alfabética, cada uma com `id` e `name`; sem sessão dá 401. Falha porque a rota e as tabelas não existem.
  - Arquivos previstos: `apps/api/prisma/schema.prisma`, nova migration com o seed (**ler o SQL**), `apps/api/src/categories/*` (module, controller, service, repository, `dto/`), `apps/api/src/app.module.ts`, `apps/api/test/categories-list.e2e-spec.ts`

- [x] **Tarefa 2 — Registrar uma compra com um produto novo**
  - Cobre: CA1, CA3, CA8, CA16, CA22 (em `POST /purchases`)
  - Teste primeiro: e2e do `POST /purchases`: usuário envia data de hoje e um item com `name` + `categoryId` fixa, sem loja; resposta 201 com `status` CONFIRMED, o item e o produto criado para o usuário com aquela categoria, `store` nula; a compra aparece no banco com `userId` do token; corpo com `userId`, `status` ou `confirmedAt` dá 400 e nada é gravado; sem sessão dá 401. Teste unitário de `purchase-calculations.ts` para a soma dos itens. Falham porque a rota e o módulo não existem.
  - Arquivos previstos: `apps/api/src/purchases/*` (module, controller, service, repository, `dto/`, `purchase-calculations.ts` e `.spec.ts`), `apps/api/src/common/normalize-name.ts` e `.spec.ts`, `apps/api/src/app.module.ts`, `apps/api/test/purchases-create.e2e-spec.ts`

- [x] **Tarefa 3 — Reaproveitar o produto que o usuário já tem**
  - Cobre: CA2, CA5, CA6
  - Teste primeiro: e2e: item com `productId` de produto do usuário reaproveita e não cria outro; item com o mesmo nome (maiúsculas e espaços diferentes) reaproveita; `productId` inexistente ou de outro usuário dá 404 e nada é gravado; o mesmo produto novo em dois itens da mesma compra gera um só produto; duas compras simultâneas do mesmo usuário com o mesmo produto novo deixam um só produto. Falham porque cada item hoje cria produto novo.
  - Arquivos previstos: `apps/api/src/purchases/purchases.service.ts`, `purchases.repository.ts`, `dto/*`, `apps/api/test/purchases-products.e2e-spec.ts`

- [x] **Tarefa 4 — Ligar a compra a uma loja, existente ou nova**
  - Cobre: CA7, CA9
  - Teste primeiro: e2e: `storeId` de loja do usuário liga a compra a ela; `storeName` cria a loja quando não existe e reaproveita quando existe (maiúsculas e espaços ignorados), sem duplicar; `storeId` inexistente ou de outro usuário dá 404 e nada é gravado. Falham porque o corpo da compra ainda não aceita loja.
  - Arquivos previstos: `apps/api/src/purchases/*` (service, repository, `dto/`, resposta com `store`), `apps/api/test/purchases-store.e2e-spec.ts`

- [ ] **Tarefa 5 — Aplicar descontos e total pago**
  - Cobre: CA10, CA11, CA12
  - Teste primeiro: unitário de `purchase-calculations.ts` (valor cheio com `quantity` decimal e arredondamento de meio-centavo, valor com desconto, desconto de caixa, total) e e2e: `discountCents` entre 0 e o valor cheio é aceito, negativo ou maior dá 400 em `items.N.discountCents` e nada é gravado; `paidTotalCents` entre 0 e a soma com descontos é aceito e a resposta traz o desconto de caixa; fora disso dá 400 em `paidTotalCents`; sem `paidTotalCents` o desconto de caixa é 0 e o total é a soma. Falham porque os campos não existem.
  - Arquivos previstos: `apps/api/src/purchases/purchase-calculations.ts` e `.spec.ts`, `purchases.service.ts`, `dto/*`, `apps/api/test/purchases-discounts.e2e-spec.ts`

- [ ] **Tarefa 6 — Recusar a compra inteira quando algo é inválido**
  - Cobre: CA4, CA13, CA14, CA15
  - Teste primeiro: e2e: item com `fullPriceCents` ≤ 0, `quantity` ≤ 0, `packageSize` ausente ou ≤ 0, `unit` fora da lista, nome vazio ou só espaços, nome com mais de 80 caracteres, mais de 100 itens, preço acima do limite ou mais de 3 casas decimais dão 400 com o índice do item e o campo, e nada é gravado (nem produto nem loja novos); categoria inexistente ou não fixa dá 400 em `categoryId`; data futura ou em formato inválido dá 400 em `date`, e a data de hoje é aceita (com o relógio fixado perto da meia-noite de `America/Sao_Paulo`); `items` vazio ou ausente dá 400. Falham porque as regras ainda não existem.
  - Arquivos previstos: `apps/api/src/purchases/dto/*`, `purchases.service.ts`, `apps/api/src/common/clock.ts`, `apps/api/test/purchases-validation.e2e-spec.ts`

- [ ] **Tarefa 7 — Listar as compras do usuário**
  - Cobre: CA17, CA22 (em `GET /purchases`)
  - Teste primeiro: e2e do `GET /purchases`: o usuário recebe só as dele, da mais recente para a mais antiga (data, depois criação), cada uma com loja, total e quantidade de itens; sem compras recebe `[]`; sem sessão dá 401. Falha porque a rota não existe.
  - Arquivos previstos: `apps/api/src/purchases/*` (controller, service, repository, `dto/`), `apps/api/test/purchases-list.e2e-spec.ts`

- [ ] **Tarefa 8 — Consultar uma compra com seus itens**
  - Cobre: CA18, CA19, CA22 (em `GET /purchases/:id`)
  - Teste primeiro: e2e do `GET /purchases/:id`: devolve a compra com os itens, cada um com produto (nome e categoria), valores informados e valor com desconto, e traz soma dos itens, desconto de caixa e total; id inexistente e id de outro usuário dão 404 com corpo idêntico; id que não é UUID dá 400; sem sessão dá 401. Falha porque a rota não existe.
  - Arquivos previstos: `apps/api/src/purchases/*` (controller, service, repository, `dto/`), `apps/api/test/purchases-detail.e2e-spec.ts`

- [ ] **Tarefa 9 — Buscar os produtos do usuário pelo nome**
  - Cobre: CA20, CA22 (em `GET /products`)
  - Teste primeiro: e2e do `GET /products?search=`: devolve só produtos do usuário cujo nome contém o termo, sem diferenciar maiúsculas nem acentos, em ordem alfabética e no máximo 20; termo que não casa dá `[]`; produto de outro usuário nunca aparece; sem sessão dá 401. Falha porque a rota não existe.
  - Arquivos previstos: `apps/api/src/products/*` (module, controller, service, repository, `dto/`), `apps/api/src/app.module.ts`, `apps/api/test/products-search.e2e-spec.ts`

- [ ] **Tarefa 10 — Provar o isolamento entre usuários e a documentação**
  - Cobre: CA23, CA24
  - Teste primeiro: e2e com dois usuários, cada um com compras, produtos e lojas: nenhuma listagem, consulta por id ou busca de um mostra dado do outro, e o produto de mesmo nome dos dois é distinto; teste do `/docs-json` conferindo que todas as rotas da história e os campos de todos os DTOs aparecem. Falha se algum campo estiver sem `@ApiProperty` ou se alguma rota vazar dado.
  - Arquivos previstos: `apps/api/test/purchases-isolation.e2e-spec.ts`, `apps/api/test/swagger.e2e-spec.ts`, os DTOs que faltarem decorar

## Critérios sem tarefa

-
