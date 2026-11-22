# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS (reprovado, por um único item: conflito com o `architecture.md`, que se resolve no documento e não no código)

Escopo: `git diff 0755c4d` mais a migration não rastreada `apps/api/prisma/migrations/20261121231747_add_user_role/migration.sql`.

## Apontamentos (bloqueiam)
1. **Coluna `role` em `User` contradiz o glossário vigente** — `apps/api/prisma/schema.prisma:12-22`
   - Regra violada: `docs/architecture.md` §5.1, "Decorrências do modelo": "Premium é derivado, não armazenado. [...] **Não existe coluna de papel em `User`.**" A entidade `User` (§5.1 e ER §5.2) lista só `id`, `email`, `passwordHash`, `tokenVersion` e `createdAt`.
   - Prejuízo concreto: o código passa a divergir do critério fixo do revisor. A frase sobre coluna de papel foi escrita para premium e RN19, mas o texto literal proíbe a coluna. Quem ler o `architecture.md` daqui a três semanas vai achar que `role` é um erro. A regra de "premium derivado" também fica ambígua.
   - Encaminhamento: a spec aprovada exige o papel ADMIN, então o código provavelmente está certo. Falta atualizar o documento por `/utf-architecture` (ou Issue de manutenção): ajustar a frase da §5.1 para "premium é derivado; `User.role` é só CUSTOMER/ADMIN" e acrescentar `role` à entidade `User` e ao ER. A decisão é do usuário na triagem.

## Sugestões (não bloqueiam)
- `apps/api/prisma/migrations/migration_lock.toml`: o diff só adiciona dois comentários de cabeçalho, gerados pelo Prisma. Não tem relação com a tarefa e polui o diff. Considere reverter essa linha ou deixar a mudança de propósito em commit à parte.
- `apps/api/src/users/users.repository.ts:9`: `role: 'CUSTOMER'` explícito no `create` repete o `@default(CUSTOMER)` do schema. Não é erro. É defesa deliberada, e o comentário explica o motivo. O teste "grava a conta como CUSTOMER" já cobre o caso.
- `apps/api/src/auth/auth.controller.ts:59-63`: a tipagem inline `Request & { user: { id; email; role } }` agora aparece com três campos. Se outro controller passar a ler `req.user` (Tarefa 2, guard de admin), vale extrair um tipo `AuthenticatedRequest` compartilhado. Hoje seria abstração para um caso só, então não bloqueia.
- `apps/api/src/auth/dto/user-response.dto.ts`: `role: 'CUSTOMER' | 'ADMIN'` literal duplica o enum `Role` do Prisma. Para o Swagger, considere `@ApiProperty({ enum: Role })`. Confira também se o plugin do Swagger gera o enum a partir da união literal.
- `apps/api/test/auth-register.e2e-spec.ts:185-189`: o caso `role: 'ADMIN'` entra na tabela `it.each` que já existia, então confere o 400 e que nenhuma conta foi criada. Isso atende o teste previsto. O teste "devolve o papel atual do banco" em `auth-me.e2e-spec.ts` é um bom extra, e prova que o papel vem do banco e não do JWT.

## Verificações sem achado
- **Camadas:** o controller só lê `req.user`. O guard consome o `UsersRepository` já existente. O Prisma só aparece no repository. Nada novo viola o fluxo controller → service → repository.
- **DTO e validação:** o `RegisterDto` não mudou. O `ValidationPipe` global (`forbidNonWhitelisted`) rejeita `role` com 400, e isso foi confirmado pelo teste.
- **Segurança:** o papel nunca vem do cliente. `/auth/me` devolve só `{ id, email, role }`, sem `passwordHash`. O guard lê o papel do banco a cada requisição.
- **Migration:** `CREATE TYPE` seguido de `ADD COLUMN ... NOT NULL DEFAULT 'CUSTOMER'`. É seguro sobre tabela com linhas, porque as linhas existentes recebem CUSTOMER sem lock longo nem backfill.
- **Swagger:** `SessionUserEnvelopeDto` está ligado ao `GET /auth/me`. O register continua com `UserEnvelopeDto`, sem `role`.
- **Lint:** `npm run lint -w apps/api` limpo. **Unit:** `npm test -w apps/api` passou, 1/1.
- **e2e, arquivos desta tarefa isolados:** `auth-register.e2e-spec.ts` passou 20/20 e `auth-me.e2e-spec.ts` passou 9/9.
- **e2e, suíte completa:** falhou de forma intermitente e não determinística. Quatro execuções deram 3, 8, 5 e 4 falhas, em arquivos e testes diferentes (`auth-login`, `auth-register-duplicado`, `auth-register`). As falhas são 400 inesperado no cadastro válido e 201 onde se esperava 400 de e-mail duplicado. Isso aponta contaminação de dados entre execuções no mesmo banco, por exemplo outro processo (dev server ou outro revisor rodando os e2e ao mesmo tempo) ou linhas residuais, e não uma regressão do diff. A causa não foi confirmada. Recomendo o usuário rodar `npm run test:e2e -w apps/api` sozinho, com nenhum outro processo usando o banco, antes de fechar a tarefa.

## Observações fora do escopo deste diff
- Os e2e dependem de `prisma.user.deleteMany()` no `beforeEach`, sobre um banco compartilhado. Isso torna a suíte frágil a execuções concorrentes. É candidato a Issue de manutenção, por exemplo para usar schema ou banco isolado por execução.
- O `architecture.md` §2.1 diz que o `JwtAuthGuard` carrega `sub` e `tokenVersion`. Para a Tarefa 2 (autorização por papel), o guard de admin precisará de uma regra declarada na §2.1 (por exemplo `@Roles`/`AdminGuard`), senão aparecerá a mesma divergência do apontamento 1.
