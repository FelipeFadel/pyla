# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

Rodei `npm run test:e2e` (2 arquivos, 3 testes, todos passam) e `npm test` (1 teste, passa). Os dois são verdes.

## Apontamentos (bloqueiam)
Nenhum.

Conferi o diff contra as regras da §2.1 do architecture.md:
- Só o `UsersRepository` chama o `PrismaService`.
- `DATABASE_URL` é lida pelo `ConfigService` (`getOrThrow`), sem URL nem segredo no código.
- O model `User` bate com o glossário da §5.1: `id`, `email` único, `passwordHash`, `tokenVersion` com padrão 0 e `createdAt`. A migration reflete o schema, com índice único em `email`.
- O `P2002` não é engolido: o repository deixa o erro subir, e a tradução fica para o filtro global em outra tarefa.
- O teste usa o repository real contra o Postgres e checa só o comportamento (`code: 'P2002'`, contagem de linhas). Não depende de detalhe interno.

## Sugestões (não bloqueiam)
- `apps/api/src/prisma/prisma.service.ts`: o `PrismaService` pede `ConfigService`, mas o `PrismaModule` não importa o `ConfigModule`. Isso só funciona porque o `ConfigModule` é global (`isGlobal: true`), e o teste e o `AppModule` o registram assim. Está de acordo com a §2.1 (ConfigModule global). Basta garantir que o `AppModule` registre o `ConfigModule` global quando a tarefa de wiring chegar.
- `apps/api/src/users/users.repository.ts`: o `create` não declara o tipo de retorno e usa um tipo inline para a entrada. Funciona. Quando o DTO e o service existirem, vale reaproveitar um tipo nomeado em vez de repetir a forma.
- `apps/api/src/users/users.repository.e2e-spec.ts`: o teste fica ao lado do código (`src/users/`), e a §3 manda os e2e para `apps/api/test/`. O `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`) pega os dois lugares. O plan.md prevê "teste ao lado", então não reprovo. Fica a divergência entre o plano e a §3 para o usuário decidir.
- O `beforeEach` do teste faz `deleteMany` na tabela `User` do banco apontado por `DATABASE_URL`. Num banco de desenvolvimento com dados reais isso apaga tudo. No CI o banco é um branch descartável do Neon, então é aceitável. Convém um banco de teste separado no local.

## Observações fora do escopo deste diff
- A pendência 3 da §7.1 (Prisma 7 com PostgreSQL 18, "falta a primeira migration real") passa a ter evidência com esta migration e os e2e verdes. Atualizar o documento por Issue de manutenção ou `/utf-architecture`, já que o documento não pode ser editado à mão.
- O §6 (Mapa de Domínios) continua vazio. Registrar o domínio `users` quando a história fechar.
