# Parecer de Código — Tarefa 5

**Veredito:** REPROVADO (1 apontamento, de gravidade baixa; todo o resto está em conformidade)

Rodei `npm run lint -w apps/api`, que passou sem avisos. Rodei `npm test -w apps/api`, que passou com 1/1. Não rodei o e2e. Avaliei `plans-update.e2e-spec.ts` por leitura.

## Apontamentos (bloqueiam)
1. **Checagem de corpo vazio feita no service, depois da validação.** — `apps/api/src/plans/plans.service.ts:35-45` (constante em `:15`)
   Regra violada: architecture.md §2.1, "Entrada da API (ID7)": "Requisição malformada é recusada antes do service, sem efeito colateral". A mesma seção diz que o service guarda regra de negócio e o DTO guarda a forma da entrada.
   Prejuízo concreto: a validação de entrada fica dividida em duas camadas. O `BadRequestException` com `details: [{ field: 'body', ... }]` é montado à mão para imitar o formato que o `ValidationPipe` gera, e pode divergir dele. Outra rota PATCH com a mesma regra teria que repetir o bloco no service.
   Como resolver, só para orientar a triagem: um validador de classe no `UpdatePlanDto`, ou um pipe, recusa o corpo antes do service.

## Conferido e em conformidade
- **Camadas:** o controller só delega (`plans.controller.ts:131`). O service não importa o Prisma Client e só usa o repository. O `PrismaService` aparece só em `plans.repository.ts`. A Subscription nunca é escrita pelo código de produção: `update` só toca `name`, `nameKey`, `priceCents` e `active` de `Plan`.
- **Param DTO:** `PlanIdParamDto` usa `IsUUID`. O `forbidNonWhitelisted` valida os params, e o e2e cobre o 400 com `field: id`.
- **UpdatePlanDto:** o `ValidateIf(value !== undefined)` faz `null` falhar nas regras (testado para name, price e active). O comentário explica por que não usa `PartialType`. As regras vêm de `PlanNameRules()` e `PlanPriceRules()`, extraídas em `create-plan.dto.ts`, sem duplicação com a criação. Os campos `nameKey`, `priceCents` e `id` no corpo são recusados pelo `forbidNonWhitelisted` (testado).
- **P2002/P2025:** a tradução é por `code`, sem importar o Prisma Client. Ela é justificada porque o filtro global traduz P2002 para um 400 genérico do cadastro. O 409 com `details` só pode sair do service. Não há checagem prévia, então a unicidade e a corrida (CA5) ficam com o índice único. O 404 vem do P2025 do `update`.
- **Ordem das rotas:** `@Get('available')` vem antes de `@Patch(':id')`, e o comentário na rota explica o motivo.
- **Roles e Swagger:** `@Roles(Role.ADMIN)` está no PATCH. As respostas 200/400/401/403/404/409/500 estão documentadas com `ErrorResponseDto`, e há `@ApiCookieAuth`.
- **Testes:** cada caso cria o próprio estado, e o `beforeEach` limpa subscription, plan e user na ordem certa de FK. As asserções são sobre comportamento observável (HTTP e banco), sem acoplamento à implementação. Há checagem de que `nameKey` e `priceCents` não vazam, e de que o plano fica intacto nas recusas.

## Sugestões (não bloqueiam)
- `plans.service.ts:78-79`: `translateWriteError` devolve `unknown` e o caller faz `throw` dele. Funciona, mas o tipo não diz nada ao leitor. `HttpException | unknown` não ajuda, então o ideal seria um tipo de retorno mais honesto, por exemplo o helper lançar ele mesmo e retornar `never`. Além disso, `(error as { code?: unknown }).code` lança `TypeError` se `error` for `null` ou primitivo. Vale um guard `typeof error === 'object' && error !== null`, como o próprio filtro global faz em `knownPrismaError`.
- `plans.service.ts:11-12`: as constantes `P2002` e `P2025` repetem o mapa do `http-exception.filter.ts`. Não é duplicação de regra, porque os significados diferem. Um comentário apontando essa diferença evitaria que alguém "unifique" os dois.
- `create-plan.dto.ts`: `PlanNameRules` e `PlanPriceRules` ficam no arquivo do DTO de criação, e o `UpdatePlanDto` importa de lá. Um arquivo `plan-rules.ts` deixaria a dependência neutra, mas por enquanto é só preferência.
- `plans-update.e2e-spec.ts`: o `sessao()` faz `register` e depois `prisma.user.update` para trocar o papel. É o mesmo padrão dos outros e2e do módulo. Se virar um terceiro ou quarto arquivo repetido, vale extrair para um helper em `test/`.
- Teste de edição sem alteração real: nenhum caso cobre `{ name: 'Basico' }` igual ao nome atual do mesmo plano. O caso de caixa diferente cobre quase tudo, então isso é só complemento.

## Observações fora do escopo deste diff
- Os e2e de plano repetem o mesmo `beforeEach` de limpeza do banco. Se eles rodarem em paralelo contra o mesmo banco, vão interferir uns nos outros. Confirmar se o `vitest.config.e2e.ts` usa execução sequencial (por exemplo `fileParallelism: false`). Candidata a Issue de manutenção.
- O `P2002: 'Não foi possível concluir o cadastro.'` do filtro global é específico do cadastro (US01). Qualquer outro domínio que deixar o P2002 chegar ao filtro receberá essa mensagem. O plano evita isso traduzindo no service, mas fica o risco para os próximos módulos.
