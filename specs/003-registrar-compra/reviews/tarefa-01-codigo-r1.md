# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

Li o `docs/architecture.md`, o diff e os 6 arquivos novos não rastreados: migration, `categories.{module,controller,service,repository}.ts`, `dto/category-response.dto.ts` e `test/categories-list.e2e-spec.ts`.

## Apontamentos (bloqueiam)
Nenhum.

Conferido contra o §2.1:
- **Camadas:** controller → service → repository → PrismaService. Só o repository (`categories.repository.ts`) toca o Prisma. O controller não tem regra de negócio.
- **Guard:** não há `@Public()`, então o `JwtAuthGuard` global vale e o 401 vem dele.
- **Envelope:** o `{ data }` fica por conta do interceptor global. O DTO só descreve o formato.
- **Propriedade do dado (RN21):** a categoria fixa (`ownerId = null`) é a mesma para todos, e não há `userId` vindo do cliente.
- **Dados:** `Int` com sufixo `Cents`, `Decimal` para quantidade e tamanho, `Restrict` nas relações e `Cascade` em Purchase → PurchaseItem. Tudo bate com §5.1 e §5.2.
- **Seed:** vem na migration, como a tarefa pede. A migration é coerente com o schema. Os 10 nomes batem com o teste.
- **Segredos:** nenhum no código.
- **Duplicação:** não há. O módulo segue o mesmo padrão de `plans`.
- **Teste e2e:** assere o contrato público (status, nomes, chaves `id`/`name`), não detalhe de implementação.

**Testes:**
- `npm test`: 1 passou (1 arquivo).
- `test/categories-list.e2e-spec.ts` rodado sozinho: 2 de 2 passam.
- `npm run test:e2e` completo: falhou 3 vezes seguidas em arquivos diferentes (auth e plans, 401 ou status inesperado); os de categories não aparecem entre as falhas.
  - A hipótese mais provável é outro processo usando o mesmo banco ao mesmo tempo (o revisor de conformidade rodando `test:e2e` em paralelo), já que cada suíte faz `user.deleteMany()`.
  - Peço rodar o `test:e2e` completo uma vez, com o banco livre, antes de fechar a tarefa.

## Sugestões (não bloqueiam)
- `schema.prisma` (model `Category`): o glossário §5.1 e o ER §5.2 listam `archivedAt?`. O `plan.md` não o inclui nesta tarefa, e a exclusão de categoria personalizada (RN13) é de outra história. Anote para quando ela chegar, para não esquecer a migration.
- `plan.md:16` pede `@ApiProperty` em todos os DTOs e fala em `@ApiBearerAuth`. O código usa `@ApiCookieAuth`, que é o correto pelo §2.2, e o DTO não tem `@ApiProperty`, igual ao `plan-response.dto.ts` existente. A tarefa final de Swagger vai conferir no `/docs-json`.
- `categories-list.e2e-spec.ts`: a lista `FIXED_CATEGORIES` duplica os nomes do seed da migration. É aceitável porque o teste fixa o contrato.

## Observações fora do escopo deste diff
- Os e2e de todas as suítes compartilham um único banco e usam `deleteMany` global, sensíveis a execução concorrente. Candidato a Issue de manutenção (banco por execução).
