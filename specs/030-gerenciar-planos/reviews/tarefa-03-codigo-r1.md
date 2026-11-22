# Parecer de Código — Tarefa 3

**Veredito:** APROVADO

Li o diff do schema e do `app.module.ts`, a migration, `src/plans/*`, o filtro global e o teste `plans-create.e2e-spec.ts`. `npm run lint -w apps/api` rodou sem erros e `npm test -w apps/api` passou (1 teste). Não rodei o e2e, como pedido. Os e2e foram avaliados por leitura.

## Apontamentos (bloqueiam)
Nenhum.

Conferências feitas, todas dentro da §2.1:
- **Camadas:**
  - O controller só delega ao service e não tem regra nem Prisma.
  - O service não importa o Prisma Client. Reconhece o erro pelo `code`, como o filtro global já faz.
  - Só o `PlansRepository` chama o `PrismaService`.
- **Validação:** o DTO fica em `dto/`. O `trim` roda antes de `IsNotEmpty` e `MaxLength`, então nome só com espaços cai em vazio. Há `maxDecimalPlaces: 2`, `Min 0.01` e `Max 9999.99`, e nome com 61 caracteres só pelo espaço interno é recusado. O `forbidNonWhitelisted` global recusa `nameKey` e `active` no corpo, e o teste cobre isso.
- **Unicidade e concorrência:**
  - O `nameKey` tem índice único no banco, sem checagem prévia.
  - O P2002 vira 409 em português, com `details` no campo `name`.
  - O teste de duas criações simultâneas exige exatamente um 201 e um 409 e confere `count() === 1`.
- **Preço:** `Math.round(price * 100)` com no máximo 2 casas é seguro. Os testes de 19.9 e 1.15 confirmam 1990 e 115 centavos.
- **Resposta:** o service devolve só `id`, `name`, `price`, `active`, `createdAt` e `updatedAt`, e um teste confirma que `nameKey` e `priceCents` não saem.
- **Segurança:** `@Roles(Role.ADMIN)` está na rota, e há testes de 403 e 401 sem nada gravado.
- **Swagger:** `@ApiCookieAuth`, `@ApiOperation` e `@ApiResponse` para 201, 400, 401, 403, 409 e 500. O envelope usa DTO, como em auth. O plugin do Swagger em `nest-cli.json` cobre os campos sem `@ApiProperty`, igual aos DTOs de auth.
- **Schema e migration:**
  - O SQL só cria `Plan` e `Subscription`, os dois índices únicos e as duas FKs `ON DELETE RESTRICT`.
  - Não há `ALTER`, `DROP` nem dado.
  - O que a Tarefa 3 acrescentou é o previsto. O enum `Role` e a coluna em `User` vêm das Tarefas 1 e 2, em outra migration.
- **Testes:**
  - O `beforeEach` limpa `subscription`, `plan` e `user` nessa ordem.
  - O `vitest.config.e2e.ts` tem `fileParallelism: false`.
  - Os asserts olham para o contrato HTTP e para o banco, não para a implementação.

## Sugestões (não bloqueiam)
- `plans.service.ts:27-35`: o service traduz o P2002 para 409 por conta própria. A §2.1 diz que o filtro global traduz os erros do Prisma, mas o P2002 do filtro dá 400 genérico por causa do cadastro (US01), então a escolha é compreensível. Quando as Tarefas 5 (editar) e 6 (excluir) precisarem do mesmo 409, vale extrair um helper, para não repetir o `catch` e a constante `P2002`. Ainda não há duplicação, por isso não bloqueia.
- `plans.service.ts:16`: `nameKey` usa `toLowerCase()`. Isso ignora maiúsculas e as pontas, como o CA4 pede. Espaços internos duplos ("Pro  Plus" e "Pro Plus") contam como nomes diferentes. Confirme com o spec se isso é intencional.
- `schema.prisma`, relação `Subscription.user`: o `onDelete` está implícito, e o padrão do Prisma para relação obrigatória já é Restrict (a migration confirma). Declarar `onDelete: Restrict` como em `plan` deixaria a intenção explícita.
- `plans.service.ts:19-26`: o mapeamento de entidade para resposta vive inline no `create`. Com as Tarefas 4 e 5 vai ser reaproveitado, e um método privado `toDto` evita copiar a conversão de preço.
- `test/plans-create.e2e-spec.ts:55`: cobre o essencial, mas o teste de concorrência dispara só 2 requisições. É suficiente para o CA5.

## Observações fora do escopo deste diff
- `apps/api/src/common/http-exception.filter.ts` tem a linha `FALLBACK` com mais de 80 colunas, fora do formatador. É pré-existente.
- A mensagem do P2002 no filtro ("Não foi possível concluir o cadastro.") é específica do cadastro. Qualquer P2002 que escape de outro módulo vai responder com texto de cadastro. É candidato a Issue de manutenção.
