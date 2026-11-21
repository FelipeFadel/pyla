# Plano — Issue #30

## Decisões técnicas

- **Papel (`Role`).** Enum `Role { CUSTOMER, ADMIN }` e campo `role` em `User`, com padrão `CUSTOMER`. A migration roda sobre `User` que já tem linhas: o padrão preenche as antigas; **ler o SQL gerado antes de commitar**.
- **Guards globais, nesta ordem.** `JwtAuthGuard` (já existe) e depois o novo `RolesGuard`, os dois em `APP_GUARD`. Ordem trocada faria o `RolesGuard` ler um usuário que ainda não existe e responder 500. O `JwtAuthGuard` já busca o usuário no banco a cada requisição, então passa a anexar o `role` atual: rebaixar vale na próxima requisição (CA16).
- **`@Roles(...)` + `RolesGuard`.** Rota sem `@Roles` passa para qualquer autenticado; com `@Roles(Role.ADMIN)`, papel diferente dá 403. Admin **não** passa nas rotas de usuário comum (a conta só administra).
- **Cadastro.** O papel é fixado no service (`CUSTOMER`). O `ValidationPipe` global tem `forbidNonWhitelisted: true`, então um corpo com `role` é **recusado com 400** antes do service e nenhuma conta nasce. Isso difere do texto do CA15 ("a conta é criada como usuário comum"): o teste prova o essencial (ninguém vira admin pelo cadastro); a redação do CA15 precisa de decisão do usuário (ver *Pontos para o usuário*).
- **Entidades novas.** `Plan` (`id`, `name`, `nameKey` único, `priceCents`, `active`, `createdAt`, `updatedAt`) e `Subscription` mínimo (`id`, `userId` único, `planId`, `priceCents` contratado, `createdAt`). Relação **1:N Plan → Subscription**, com `onDelete: Restrict`. Nenhuma rota cria `Subscription`: ela só existe por teste e banco (TODO #7).
- **Unicidade do nome.** `nameKey` = nome sem espaços nas pontas, em minúsculas, com índice único no banco. É ele que resolve a corrida do CA5 (erro de unicidade vira 409), não uma checagem prévia.
- **Preço.** O contrato da API usa o preço em reais com até 2 casas (`price`, máx. 9999.99, > 0); o banco guarda centavos inteiros (`priceCents`).
- **Módulo `plans`** (controller → service → repository). Rotas, todas sob `JwtAuthGuard`:
  - `GET /plans`, `POST /plans`, `PATCH /plans/:id` (nome, preço e/ou `active`), `DELETE /plans/:id`: `@Roles(Role.ADMIN)`.
  - `GET /plans/available`: qualquer autenticado, só planos ativos.
  - `404` para plano inexistente, `409` para nome repetido e exclusão com assinantes, `400` para validação.
- **`GET /auth/me`** passa a devolver também `role`.
- **Frontend.** Nova feature `plans` (`api/` com repositório e hooks, `pages/`, `components/`), rota `/admin/planos` atrás de um `RequireAdmin`. O papel vem de `/auth/me`. Só o cliente HTTP de `shared/` chama `fetch`; o 401 já leva ao login.
- **Documentação (Passo 4, não é tarefa de código).** `architecture.md` ganha `Role`, `Plan`, `Subscription.planId` e preço contratado, o diagrama ER e a linha em §6.

## Tarefas

- [ ] **Tarefa 1 — Fixar o papel do usuário no cadastro e na sessão**
  - Cobre: CA15, CA17 (parte da API: o papel na sessão)
  - Teste primeiro: e2e que cadastra, consulta `/auth/me` e espera `role: "CUSTOMER"`; e2e que cadastra com `"role": "ADMIN"` no corpo e espera 400, sem conta criada. Falham porque o campo não existe.
  - Arquivos previstos: `apps/api/prisma/schema.prisma`, nova migration, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/dto/user-response.dto.ts`, `apps/api/src/auth/jwt-auth.guard.ts`, `apps/api/src/users/*`, `apps/api/test/auth-register.e2e-spec.ts`, `apps/api/test/auth-me.e2e-spec.ts`

- [ ] **Tarefa 2 — Barrar por papel com o `RolesGuard`**
  - Cobre: CA13 (base do 403), CA14 (401 sem sessão), CA16
  - Teste primeiro: e2e com uma rota de teste marcada `@Roles(Role.ADMIN)`: sem sessão dá 401, cliente dá 403, admin dá 200, e um admin rebaixado no banco dá 403 na requisição seguinte com a mesma sessão. Falha porque `@Roles` e o guard não existem.
  - Arquivos previstos: `apps/api/src/auth/roles.decorator.ts`, `apps/api/src/auth/roles.guard.ts`, `apps/api/src/auth/auth.module.ts`, `apps/api/test/roles.e2e-spec.ts`

- [ ] **Tarefa 3 — Criar um plano**
  - Cobre: CA2, CA3 (criação), CA4 (criação), CA5, CA13 e CA14 em `POST /plans`
  - Teste primeiro: e2e do `POST /plans`: admin cria e o nome volta sem espaços nas pontas; nome vazio, só espaços, com mais de 60 caracteres, preço não numérico, ≤ 0 ou > 9999.99 dão 400 indicando o campo; nome repetido (maiúsculas e espaços ignorados) dá 409; duas criações simultâneas com o mesmo nome criam só uma; cliente dá 403 e sem sessão dá 401. Falham porque a rota e as tabelas não existem.
  - Arquivos previstos: `apps/api/prisma/schema.prisma` (`Plan`, `Subscription`), nova migration (**ler o SQL**), `apps/api/src/plans/*` (module, controller, service, repository, `dto/`), `apps/api/src/app.module.ts`, `apps/api/test/plans-create.e2e-spec.ts`

- [ ] **Tarefa 4 — Listar os planos (gestão e disponíveis)**
  - Cobre: CA1 (API), CA9, CA13 e CA14 nas duas rotas de listagem
  - Teste primeiro: e2e do `GET /plans`: admin recebe ativos e inativos em ordem alfabética, lista vazia dá `[]`, cliente dá 403, sem sessão dá 401. E2e do `GET /plans/available`: qualquer autenticado recebe só os ativos, sem sessão dá 401. Falham porque as rotas não existem.
  - Arquivos previstos: `apps/api/src/plans/plans.controller.ts`, `plans.service.ts`, `plans.repository.ts`, `apps/api/test/plans-list.e2e-spec.ts`

- [ ] **Tarefa 5 — Editar, ativar e desativar um plano**
  - Cobre: CA3 (edição), CA4 (edição), CA6, CA7, CA8, CA12 (editar), CA13 e CA14 em `PATCH /plans/:id`
  - Teste primeiro: e2e do `PATCH /plans/:id`: edição válida atualiza; as mesmas recusas de 400 e 409 da criação valem na edição (e o plano não muda); com uma `Subscription` criada direto no banco, mudar o preço não altera o preço contratado dela e o `GET /plans/available` mostra o novo; desativar tira o plano de `available` e a assinatura segue intacta; ativar o devolve; id inexistente dá 404; cliente dá 403 e sem sessão dá 401. Falham porque a rota não existe.
  - Arquivos previstos: `apps/api/src/plans/*` (controller, service, repository, `dto/update-plan.dto.ts`), `apps/api/test/plans-update.e2e-spec.ts`

- [ ] **Tarefa 6 — Excluir um plano**
  - Cobre: CA10 (API), CA11, CA12 (excluir), CA13 e CA14 em `DELETE /plans/:id`
  - Teste primeiro: e2e do `DELETE /plans/:id`: plano sem assinantes some da lista e de `available`; plano com assinante (criado direto no banco) dá 409 com mensagem sugerindo desativar e o plano permanece; id inexistente dá 404; cliente dá 403 e sem sessão dá 401. Falham porque a rota não existe.
  - Arquivos previstos: `apps/api/src/plans/*` (controller, service, repository), `apps/api/test/plans-delete.e2e-spec.ts`

- [ ] **Tarefa 7 — Mostrar o menu e a rota de administração só para o administrador**
  - Cobre: CA17 (front)
  - Teste primeiro: teste de componente e de rota: com sessão de administrador, o menu mostra o acesso à gestão de planos e `/admin/planos` abre; com sessão de usuário comum, o acesso não aparece e `/admin/planos` leva de volta à área interna. Falha porque a sessão do front ainda não tem o papel nem existe `RequireAdmin`.
  - Arquivos previstos: `apps/web/src/features/auth/api/*`, `apps/web/src/app/RequireAdmin.tsx`, `apps/web/src/app/routes.tsx`, `apps/web/src/features/auth/pages/HomePage.tsx`, testes ao lado

- [ ] **Tarefa 8 — Tela de gestão: listar e criar planos**
  - Cobre: CA1 (front), CA2 (front), CA3 e CA4 (erros ao lado do campo, na criação), CA18, CA20
  - Teste primeiro: teste da página, por papel e rótulo: lista os planos com nome, preço e estado; sem planos mostra o estado vazio; criar com dados válidos faz o plano aparecer ativo; 400 e 409 aparecem ligados ao campo (`aria-describedby`); falha de rede mostra erro em português e mantém o formulário preenchido; todo campo tem rótulo e o formulário opera só pelo teclado. Falham porque a página não existe.
  - Arquivos previstos: `apps/web/src/features/plans/api/*` (repositório, hooks), `apps/web/src/features/plans/pages/PlansAdminPage.tsx`, `apps/web/src/features/plans/components/*`, `apps/web/src/app/routes.tsx`, testes ao lado

- [ ] **Tarefa 9 — Tela de gestão: editar, ativar e desativar**
  - Cobre: CA3 e CA4 (na edição), CA6 (front), CA7 e CA8 (front), CA12 (editar, ativar e desativar), CA20
  - Teste primeiro: teste da página: editar nome e preço atualiza a linha; erros 400 e 409 aparecem junto ao campo; ativar e desativar trocam o estado exibido; 404 mostra mensagem em português e atualiza a lista; os controles novos têm rótulo e operam por teclado. Falham porque a ação não existe na tela.
  - Arquivos previstos: `apps/web/src/features/plans/api/*`, `apps/web/src/features/plans/pages/PlansAdminPage.tsx`, `apps/web/src/features/plans/components/*`, testes ao lado

- [ ] **Tarefa 10 — Tela de gestão: excluir com confirmação e sessão expirada**
  - Cobre: CA10 (front), CA11 (front), CA12 (excluir), CA19
  - Teste primeiro: teste da página: excluir pede confirmação, confirmar remove o plano da lista e cancelar não altera nada; 409 mostra a mensagem sugerindo desativar e o plano permanece; 404 mostra mensagem e atualiza a lista; um 401 em qualquer ação da tela leva ao login sem erro técnico. Falham porque a exclusão não existe na tela.
  - Arquivos previstos: `apps/web/src/features/plans/api/*`, `apps/web/src/features/plans/pages/PlansAdminPage.tsx`, `apps/web/src/features/plans/components/*`, testes ao lado

## Critérios sem tarefa

-
