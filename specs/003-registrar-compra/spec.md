---
issue: 3
status: aprovada
---

# US02 — Registrar uma compra item a item (núcleo da compra, só API)

## O problema

Hoje o Pyla não guarda nada do que o usuário compra. Sem o registro de uma compra com seus itens (produto, quantidade, embalagem, preço), não existe resumo do mês, comparação de custo por unidade nem histórico de preço: todas as outras histórias de valor dependem desta. O registro precisa ser da compra inteira de uma vez, validado por inteiro, e protegido para que cada pessoa veja só o que é dela.

## A história

**Como** usuário autenticado, **eu quero** registrar uma compra inteira de uma vez — loja, data e cada item com quantidade, tamanho da embalagem e preço pago — **para que** esse registro alimente o controle do meu gasto e passe a valer como referência de preço nas próximas comparações.

> Recorte desta Issue: só o **núcleo da compra**, pela API. Rascunho, sugestão de loja por localização, base coletiva e a tela estão em "Fora de escopo".

## Critérios de aceite

Convenção de valores: dinheiro em **centavos inteiros** (`fullPriceCents`, `discountCents`, `paidTotalCents`); `quantity` e `packageSize` decimais (até 3 casas); `unit` em `KG`, `G`, `L`, `ML`, `UNIT`. O valor de um item com desconto é `round(fullPriceCents × quantity) − discountCents`, arredondando meio-centavo para cima.

**Registrar**

- [ ] **CA1 — Dado** um usuário autenticado, **quando** envia uma compra com data (hoje ou passada) e ao menos um item completo (produto, `quantity`, `packageSize`, `unit`, `fullPriceCents`), **então** a resposta é 201, a compra fica gravada com `status` CONFIRMED e todos os seus itens, e passa a constar na lista das compras do usuário.
- [ ] **CA2 — Dado** um produto que o usuário já tem, **quando** o item o referencia por `productId`, ou por um nome igual ao existente (sem diferenciar maiúsculas nem espaços nas pontas), **então** o produto existente é reaproveitado e nenhum produto duplicado é criado (RN10).
- [ ] **CA3 — Dado** um item com um produto que o usuário nunca registrou, **quando** ele informa `name` e `categoryId` de uma categoria fixa do sistema, **então** o produto é criado para o usuário, com essa categoria, na mesma operação da compra.
- [ ] **CA4 — Dado** um item que informa categoria inexistente, ou que não seja fixa do sistema (categoria personalizada é premium, US11), **quando** a compra é enviada, **então** é recusada com 400 indicando o item e o campo `categoryId`, e nada é gravado.
- [ ] **CA5 — Dado** um `productId` que não existe ou que pertence a outro usuário, **quando** a compra é enviada, **então** a resposta é 404 e nada é gravado.
- [ ] **CA6 — Dado** uma compra em que o mesmo produto novo aparece em dois itens, ou duas compras do mesmo usuário enviadas ao mesmo tempo com o mesmo produto novo, **quando** ambas chegam à API, **então** existe um único produto com aquele nome para o usuário.

**Loja (opcional, RN09)**

- [ ] **CA7 — Dado** uma compra com `storeId` de uma loja do usuário, ou com `storeName`, **quando** é registrada, **então** fica ligada a essa loja; no caso do nome, a loja do usuário com o mesmo nome (sem diferenciar maiúsculas nem espaços nas pontas) é reaproveitada, e se não existe ela é criada.
- [ ] **CA8 — Dado** uma compra sem `storeId` nem `storeName`, **quando** é registrada, **então** é aceita, sem loja (`store` nula na resposta).
- [ ] **CA9 — Dado** um `storeId` que não existe ou pertence a outro usuário, **quando** a compra é enviada, **então** a resposta é 404 e nada é gravado.

**Descontos e total (RN04, RN08, RN23)**

- [ ] **CA10 — Dado** um item com `discountCents` (opcional, padrão 0), **quando** o valor é maior ou igual a 0 e não maior que o valor cheio do item (`round(fullPriceCents × quantity)`), **então** é aceito; fora disso a compra é recusada com 400 indicando o item e o campo `discountCents`, e nada é gravado.
- [ ] **CA11 — Dado** um `paidTotalCents` informado (opcional), **quando** é maior ou igual a 0 e não maior que a soma dos itens já com seus descontos, **então** é aceito e a resposta traz o desconto de caixa (soma dos itens − `paidTotalCents`); fora disso é recusado com 400 indicando o campo, e nada é gravado.
- [ ] **CA12 — Dado** uma compra sem `paidTotalCents`, **quando** é registrada, **então** o desconto de caixa é 0 e o total da compra é a soma dos itens com desconto (RN08).

**Validação (tudo ou nada)**

- [ ] **CA13 — Dado** um item com `fullPriceCents` menor ou igual a 0, `quantity` menor ou igual a 0, `packageSize` ausente ou menor ou igual a 0, `unit` fora da lista, nome de produto vazio ou só espaços, ou qualquer limite de tamanho abaixo excedido, **quando** a compra é enviada, **então** a compra inteira é recusada com 400 indicando o índice do item e o campo, e nada é gravado — nem compra, nem itens, nem produto, nem loja novos.
- [ ] **CA14 — Dado** uma data no futuro ou em formato inválido, **quando** a compra é enviada, **então** é recusada com 400 e mensagem clara no campo `date`, e nada é gravado. A data de hoje é aceita (dia calendário em `America/Sao_Paulo`).
- [ ] **CA15 — Dado** uma compra com lista de itens vazia ou ausente, **quando** é enviada, **então** é recusada com 400 (RN03) e nada é gravado.
- [ ] **CA16 — Dado** um corpo com `userId`, `status` ou `confirmedAt`, **quando** a compra é enviada, **então** esses campos não têm efeito: a compra é sempre do usuário do token e sempre CONFIRMED.

**Ler**

- [ ] **CA17 — Dado** um usuário com compras registradas, **quando** consulta suas compras, **então** recebe só as dele, da mais recente para a mais antiga (data, depois criação), cada uma com loja, total e quantidade de itens; sem compras, recebe lista vazia.
- [ ] **CA18 — Dado** uma compra do usuário, **quando** ele a consulta pelo id, **então** a resposta traz a compra com seus itens, cada um com produto (nome e categoria), valores informados e o valor do item com desconto, e traz a soma dos itens, o desconto de caixa e o total.
- [ ] **CA19 — Dado** o id de uma compra que não existe ou que é de outro usuário, **quando** é consultada, **então** a resposta é 404, idêntica nos dois casos (não revela que a compra existe).
- [ ] **CA20 — Dado** um usuário que digita parte do nome de um produto, **quando** busca produtos por esse termo (sem diferenciar maiúsculas nem acentos), **então** recebe só produtos dele cujo nome contém o termo, em ordem alfabética, até 20 resultados.
- [ ] **CA21 — Dado** um usuário autenticado, **quando** consulta as categorias, **então** recebe as categorias fixas do sistema em ordem alfabética.

**Segurança e contrato**

- [ ] **CA22 — Dado** um usuário sem sessão válida, **quando** acessa qualquer rota desta história (registrar, listar, consultar, buscar produtos, listar categorias), **então** a resposta é 401.
- [ ] **CA23 — Dado** dois usuários com compras, produtos e lojas, **quando** cada um consulta suas compras e busca produtos, **então** nenhum dado do outro aparece (RN21).
- [ ] **CA24 — Dado** a documentação Swagger em `/docs`, **quando** é aberta, **então** todas as rotas desta história aparecem com os campos dos DTOs de entrada e de saída documentados.

**Limites de tamanho (valem em CA13):** nome de produto e de loja até 80 caracteres; até 100 itens por compra; `fullPriceCents` até 10.000.000 (R$ 100.000,00); `quantity` até 9999,999; `packageSize` até 99999,999; no máximo 3 casas decimais nos dois.

## Fora de escopo

- **Rascunho de compra** (retomar, descartar, um por usuário, expiração por inatividade, cópia no navegador): aqui a compra nasce direto CONFIRMED. O enum `status` já tem `DRAFT`, mas nenhuma rota cria rascunho.
- **Sugestão de loja por localização** e o cadastro de coordenadas da loja.
- **Base coletiva anônima de preços** (`CollectivePricePoint`) e o aviso de que o preço alimenta a comparação (RN06): a compra confirmada não grava ponto coletivo.
- **Corrigir ou excluir compra** (US14), inclusive editar itens: aqui só se cria e se lê.
- **Categorias personalizadas** (US11) e o cálculo de premium.
- **Resumo do mês, comparação de custo por unidade e histórico de preço** (US03, US04, US05): este registro só entrega os dados.
- **Tela** de registro de compra e autocomplete no front (Entrega 3, ID15/ID16).
- **Proteção contra envio duplicado** da mesma compra (clique duplo gera duas compras).
- Paginação da lista de compras; CRUD de lojas e de produtos fora do fluxo da compra.

## Abandono no meio

`docs/user-flows.md` tem a Jornada 2, e o ponto de desistência dela é o **rascunho**: a pessoa sai no meio da lista de itens e quer reencontrá-la. Esse caso fica fora desta Issue, deliberadamente, e vira Issue própria (ver "Assume que"). O que esta Issue garante sobre abandono e falha:

- **Falha no meio do registro.** Se qualquer item é inválido, ou o banco falha ao gravar o terceiro item, nada fica pela metade: compra, itens, produtos e lojas novos são gravados numa única transação (CA13, CA6).
- **Rede cai depois do envio.** A pessoa não sabe se a compra foi gravada. Ela consulta suas compras (CA17) antes de tentar de novo; reenviar cria outra compra, e proteger contra isso está fora de escopo.
- **Sessão expira no meio.** A resposta é 401 (CA22) e nada é gravado.
- **Dois envios ao mesmo tempo com o mesmo produto novo.** Garantido pela unicidade `userId` + `normalizedName` no banco, não por checagem que poderia perder a corrida (CA6).

## Assume que

| Premissa                                                                                                                                   | Issue que fecha                                   |
|--------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| Compra nasce já confirmada, sem rascunho: o critério de rascunho, retomada, descarte, rascunho único e expiração da US02 ainda não existe. | A abrir (US02 — rascunho de compra)               |
| A compra confirmada não alimenta a base coletiva anônima nem mostra o aviso da RN06; o critério final da US02 só fecha com isso.           | A abrir (US02 — base coletiva de preços)          |
| Loja só se cria por nome durante a compra, sem coordenadas, então a sugestão por localização não tem de onde sugerir.                      | A abrir (US02 — sugestão de loja por localização) |
| Compra só é criada e lida: editar e excluir (necessários para o CRUD completo do ID8) chegam com a US14.                                   | #13 (US14)                                        |

## Depende de

- #2 (US01): autenticação e `JwtAuthGuard` global, já na `main`.

## Dúvidas em aberto

| # | Dúvida                                                                                                                                                                                                                                                               | Quem responde |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| 1 | O `architecture.md` §5.1 diz "dinheiro é `Decimal`", mas `Plan.priceCents` já usa centavos inteiros e você escolheu centavos aqui. Confirma centavos (`Int`) para `fullPrice`, `discount` e `paidTotal`, e que o `architecture.md` e o ER passam a dizer `...Cents`? | Usuário       |
| 2 | Lista das categorias fixas do seed: Hortifruti, Mercearia, Carnes e peixes, Laticínios e frios, Padaria, Bebidas, Limpeza, Higiene e beleza, Congelados, Outros. Está boa?                                                                                           | Usuário       |
| 3 | `Store` precisa de `normalizedName` único por usuário para reaproveitar a loja por nome (CA7); o ER de hoje não tem. Pode entrar no `architecture.md` junto?                                                                                                         | Usuário       |
| 4 | Os limites de tamanho (80 caracteres, 100 itens, R$ 100.000,00 por preço, 3 casas decimais) e o arredondamento do valor do item (meio-centavo para cima) são os que você quer?                                                                                       | Usuário       |
