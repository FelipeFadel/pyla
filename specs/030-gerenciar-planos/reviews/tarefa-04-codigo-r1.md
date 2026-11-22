# Parecer de Código — Tarefa 4

**Veredito:** APROVADO

Não rodei o e2e, como pedido. `npm run lint -w apps/api` passou sem avisos. `npm test -w apps/api` passou, 1 teste de 1. Os e2e foram avaliados só por leitura.

## Apontamentos (bloqueiam)
Nenhum.

Conferido contra o critério da §2.1 do `docs/architecture.md`:
- **Camadas:** o controller só delega ao service. O service não importa o Prisma Client e fala só com `PlansRepository`. `prisma.plan.findMany` aparece apenas em `plans.repository.ts`.
- **`@Roles`:** `GET /plans` tem `@Roles(Role.ADMIN)`. `GET /plans/available` não tem, o que bate com o plano ("qualquer autenticado"). O `JwtAuthGuard` global continua dando 401 sem sessão, e o teste cobre isso.
- **Ordem das rotas:** `available` é estática e vem depois de `@Get()` sem `:id` no controller. O comentário avisa que ela precisa ficar antes de qualquer rota com parâmetro. Quando a Tarefa 5 incluir `:id`, ela tem de entrar depois de `available`.
- **Ordenação:** `orderBy: { nameKey: 'asc' }` nos dois métodos do repository. O comentário explica o motivo. O e2e usa `banana`, `Abacaxi` e `cereja`, então prova a ordem sem diferenciar maiúsculas.
- **Mapeamento:** `create` e `findAll` usam o mesmo `toDto`, então `priceCents` vira `price` em um só lugar. O refactor de `create` não mudou o contrato. `nameKey` e `priceCents` não saem na resposta, e há teste explícito para isso.
- **DTOs e Swagger:** `PlanDto`, `AvailablePlanDto` e os envelopes ficam em `dto/plan-response.dto.ts`. O estilo é o mesmo de `user-response.dto.ts`, com o plugin do Swagger e `introspectComments` ligados no `nest-cli.json`. Cada rota declara 200, 401, 500 e `ErrorResponseDto`. `GET /plans` também declara 403. As duas usam `@ApiCookieAuth`.
- **Testes:** o `beforeEach` limpa subscription, plan e user, na ordem certa por causa da FK. Os testes só verificam o comportamento HTTP e não dependem de detalhe interno.

## Sugestões (não bloqueiam)
- `plans.service.ts:41-47`: `findAvailable` refaz à mão o `priceCents / 100` que `toDto` já faz. A regra de conversão ficou em dois lugares, e se o formato do preço mudar, um deles pode ficar para trás. Uma opção é derivar de `toDto`, por exemplo `const { id, name, price } = this.toDto(plan)`. Não bloqueia porque o contrato resumido é intencionalmente menor e são só 3 campos.
- `plans.service.ts:50-57`: o tipo inline do parâmetro de `toDto` repete a forma do modelo `Plan`. Dá para usar o tipo `Plan` do client gerado (`../generated/prisma/models.js`) e evitar que o tipo fique desatualizado quando o schema mudar.
- `plans-list.e2e-spec.ts:132-147`: o helper `semInativos` faz o setup e também as asserções, e o nome não diz isso. Um nome como `esperaSoAtivos` ou `verificaDisponiveisPara` deixaria o papel claro.
- `plans-list.e2e-spec.ts`: faltou um teste de `GET /plans/available` com plano inativo que verifique que `active`, `nameKey` e `priceCents` não vazam. O `toEqual` exato já cobre isso na prática, então é só redundância opcional.

## Observações fora do escopo deste diff
- O mapa de domínios da §6 do `architecture.md` ainda está vazio. A linha de `plans` deveria ser adicionada pelo fluxo `/utf-architecture` ou por uma Issue de manutenção, e não pelo implementador.
