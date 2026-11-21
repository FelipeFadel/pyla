---
issue: 30
status: aprovada
---

# US15 — Gerenciar os planos de assinatura

## O problema

Hoje o Pyla não tem quem o administre: toda conta nasce igual, e não existe o conceito de "plano" que alguém possa definir. O premium é descrito no PRD, mas nome e preço dele não moram em lugar nenhum que uma pessoa responsável consiga mudar. Sem isso, a história de assinatura (US06) não tem o que vender, e qualquer mudança de preço exigiria mexer no código. Precisa existir um administrador, separado do usuário comum, que controle a oferta de planos sem afetar o que quem já assina contratou.

## A história

**Como** administrador, **eu quero** criar, editar, ativar, desativar e excluir os planos de assinatura, **para que** o Pyla ofereça o premium com o nome e o preço que eu definir, sem mexer no que quem já assina contratou.

## Critérios de aceite

- [ ] **CA1 — Dado** um administrador autenticado, **quando** abre a gestão de planos, **então** vê todos os planos, ativos e inativos, com nome, preço e estado de cada um, em ordem alfabética de nome; se não existe nenhum plano, vê um estado vazio que o convida a criar o primeiro.
- [ ] **CA2 — Dado** um administrador, **quando** cria um plano com nome e preço válidos, **então** a resposta é de sucesso, o plano aparece na lista como ativo e o nome fica gravado sem espaços nas pontas.
- [ ] **CA3 — Dado** um administrador, **quando** cria ou edita um plano com nome vazio ou só espaços, nome com mais de 60 caracteres, preço que não seja número, preço igual ou menor que zero ou preço acima de R$ 9.999,99, **então** a operação é recusada com status 400, a resposta indica qual campo está errado, e nada é gravado nem alterado.
- [ ] **CA4 — Dado** um plano já existente, **quando** o administrador cria ou edita outro plano com o mesmo nome (sem diferenciar maiúsculas nem espaços nas pontas), **então** a operação é recusada com status 409 e uma mensagem que aponta o campo nome, e nada é gravado.
- [ ] **CA5 — Dado** duas criações de plano enviadas ao mesmo tempo com o mesmo nome, **quando** ambas chegam à API, **então** exatamente um plano é criado e a outra recebe a mesma recusa do CA4.
- [ ] **CA6 — Dado** um plano com assinantes, **quando** o administrador altera o nome ou o preço, **então** o plano é atualizado, quem já assina continua com o preço que contratou, e quem assinar depois paga o novo preço.
- [ ] **CA7 — Dado** um plano ativo, **quando** o administrador o desativa, **então** ele deixa de constar entre os planos disponíveis para assinar, e as assinaturas que já existem nele continuam como estavam.
- [ ] **CA8 — Dado** um plano inativo, **quando** o administrador o ativa, **então** ele volta a constar entre os planos disponíveis para assinar.
- [ ] **CA9 — Dado** um usuário autenticado, **quando** consulta os planos disponíveis para assinar, **então** recebe só os planos ativos, com nome e preço, e nenhum inativo.
- [ ] **CA10 — Dado** um plano sem assinantes, **quando** o administrador confirma a exclusão, **então** o plano some da lista e dos planos disponíveis. Antes de excluir, a tela pede confirmação, e cancelar a confirmação não altera nada.
- [ ] **CA11 — Dado** um plano com assinantes, **quando** o administrador tenta excluí-lo, **então** a exclusão é recusada com status 409, o plano permanece, e a mensagem sugere desativá-lo.
- [ ] **CA12 — Dado** um plano que já não existe (por exemplo, excluído em outra aba), **quando** o administrador tenta editar, ativar, desativar ou excluí-lo, **então** a resposta é 404, e a tela mostra uma mensagem em português e atualiza a lista.
- [ ] **CA13 — Dado** um usuário autenticado que não é administrador, **quando** tenta qualquer operação de gestão de planos (listar todos, criar, editar, ativar, desativar ou excluir), **então** a resposta é 403, nada é alterado, e o plano continua exatamente como estava.
- [ ] **CA14 — Dado** um usuário sem sessão válida, **quando** tenta qualquer operação de gestão ou a consulta de planos disponíveis, **então** a resposta é 401 e o front o leva ao login.
- [ ] **CA15 — Dado** um cadastro enviado com um campo de papel no corpo (por exemplo, `"role": "ADMIN"`), **quando** a conta é criada, **então** ela nasce como usuário comum, e nenhuma rota da API promove alguém a administrador.
- [ ] **CA16 — Dado** um administrador cujo papel foi rebaixado no banco, **quando** ele faz a próxima requisição de gestão, **então** a resposta é 403, mesmo com a sessão ainda válida.
- [ ] **CA17 — Dado** um usuário logado, **quando** o front consulta a sessão atual, **então** a resposta traz também o papel dele; e o menu mostra o acesso à gestão de planos só para administrador. Um usuário comum que digita o endereço da tela de gestão é levado de volta à área interna.
- [ ] **CA18 — Dado** um administrador que envia o formulário de criar ou editar plano e a rede falha, **quando** a requisição não completa, **então** o front mostra uma mensagem de erro em português, mantém o formulário preenchido e permite tentar de novo, sem tela em branco.
- [ ] **CA19 — Dado** um administrador com a sessão expirada no meio do uso, **quando** qualquer ação de gestão recebe 401, **então** o front o leva ao login, sem mostrar erro técnico.
- [ ] **CA20 — Dado** a tela de gestão de planos, **quando** o administrador a usa, **então** todo campo tem rótulo associado, cada erro de validação aparece junto ao campo de forma programática (não só por cor), e a tela é operável só pelo teclado.

## Fora de escopo

- Administrar as assinaturas dos usuários e moderar o histórico de preços: estão nos *non-goals* do PRD e dependem das US05, US06, US07 e US12.
- Criar assinatura, cobrar ou ativar premium: pertencem às US06 e US07. Aqui nenhuma rota cria assinatura.
- Promover alguém a administrador por tela, rota ou script. O primeiro administrador é criado à mão, trocando o papel de um usuário direto no banco (Prisma Studio).
- Periodicidade do plano (mensal, anual), descrição, lista de benefícios ou mais de um preço por plano.
- Histórico de alterações de plano e registro de quem alterou.
- Paginação, busca e ordenação personalizada da lista de planos.
- Limite de tentativas de requisição e bloqueio de conta.
- Documentação do Swagger para as novas rotas além do que o `architecture.md` já prevê para as rotas autenticadas.

## Abandono no meio

`docs/user-flows.md` não tem jornada desta história, então os casos vêm dos critérios do PRD e de perguntar onde o fluxo pode quebrar:

- **Sessão que expira com a tela aberta.** O administrador continua clicando e a API passa a responder 401. O front leva ao login (CA19), como na US01.
- **Rede que cai no envio do formulário.** O administrador não sabe se o plano foi salvo. O front mostra o erro e preserva o que foi digitado (CA18). Se o primeiro envio tinha chegado, a nova tentativa cai no caso de nome já usado (CA4).
- **Clique duplo ou duas abas criando o mesmo plano.** Só pode existir um (CA5), garantido pela unicidade no banco e não por uma checagem que poderia perder a corrida.
- **Plano excluído em outra aba.** Editar ou excluir de novo cai em plano inexistente (CA12), e a lista é atualizada.
- **Clique acidental em excluir.** A confirmação evita a perda (CA10), e a regra de assinantes protege o que é mais caro de perder (CA11).
- **Administrador rebaixado com sessão aberta.** O acesso cai na próxima requisição (CA16), sem esperar o token expirar.

## Assume que

| Premissa                                                                                                                                                                                                                       | Issue que fecha |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| Assinantes só existem se forem criados direto no banco ou nos testes: nenhuma rota cria assinatura. A regra de exclusão (CA11) e a do preço contratado (CA6) funcionam, mas ainda não há como um usuário real virar assinante. | #7 (US06)       |

## Dúvidas em aberto

| # | Dúvida | Quem responde |
|---|--------|---------------|
