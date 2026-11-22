# Parecer de Código — Tarefa 6

**Veredito:** APROVADO (sem apontamentos bloqueantes)

Rodei `npm run lint -w apps/api` (limpo) e `npm test -w apps/api` (1/1 passou). Não rodei o e2e, como pedido. Avaliei o e2e por leitura.

## Apontamentos (bloqueiam)
Nenhum.

Conferências:
- **Camadas.** A regra RN25 está no service (`remove`, `plans.service.ts`). O Prisma só aparece em `plans.repository.ts` (`delete`, `countSubscriptions`). O service não importa o Prisma Client e reconhece o erro por `code`. O controller só delega.
- **Corrida.** Há checagem prévia, FK `onDelete: Restrict` (schema e migration) e o ramo P2003 → 409. A checagem prévia não é a única proteção. O teste "corrida" prova isso com `vi.spyOn(repository, 'countSubscriptions').mockResolvedValue(0)`.
- **Rotas e acesso.** `@Delete(':id')` vem depois de `@Get('available')`, então não há conflito. `@Roles(Role.ADMIN)` e `@ApiCookieAuth` estão presentes. O `PlanIdParamDto` dá 400 antes do service.
- **204 e Swagger.** O `ResponseInterceptor` devolve `{data: null}`, mas o Node descarta o corpo num 204, e o teste confere `res.text === ''`. O Swagger declara 204 sem `type`, o que é coerente. Declara também 400, 401, 403, 404, 409 e 500.
- **Mensagem do 409.** Contém "desativ" e não vaza P2003, prisma, constraint nem foreign. O teste verifica isso.
- **Isolamento do spy.** `afterEach(vi.restoreAllMocks)` restaura o spy. `moduleRef.get(PlansRepository)` devolve o mesmo singleton que o service usa. O spy fica na instância, não no protótipo. O `beforeEach` limpa as tabelas, então os testes não dependem uns dos outros.

## Sugestões (não bloqueiam)
- **P2003 em `translateWriteError` é acoplado a `remove`.** `plans.service.ts`, ramo `FOREIGN_KEY_VIOLATION`. A função é compartilhada com `create` e `update`, que não têm FK de saída em `Plan`. Hoje o ramo é inalcançável nesses dois métodos, mas um P2003 futuro ali viraria "tem assinantes". Alternativa: tratar o P2003 só no `catch` de `remove`. O nome "WriteError" mistura criar, editar e excluir.
- **Ramo P2025 serve a `update` e a `delete`.** O comentário acima de `translateWriteError` fala só do índice único (CA5). Vale um comentário curto dizendo que P2025 cobre update e delete.
- **`hasSubscribersError()` tem dois chamadores.** É aceitável. Poderia ser só a constante mais `new ConflictException(...)`, mas isso é estilo.
- **Variável não usada.** O teste não usa `assinatura` além do `findUniqueOrThrow`. Está correto, é só uma observação.
- **Verbosidade do e2e.** O teste de 409 repete as checagens de vazamento no caso da corrida. Poderia virar um helper, mas não há prejuízo.

## Observações fora do escopo deste diff
- O `http-exception.filter.ts` (`PRISMA_ERRORS`) já traduz P2003 → 409 e P2025 → 404 de forma genérica. O service traduz por conta própria para dar a mensagem específica ("desative-o"). Isso é intencional e correto, mas o mapeamento de P2002 existe nos dois lugares com textos diferentes (400 genérico no filtro, 409 com mensagem no service). Vale registrar a convenção (service traduz o que tem mensagem de domínio, filtro é a rede de segurança) como Issue de documentação em `docs/architecture.md`.
