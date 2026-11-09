# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

Rodei `git diff b9e2984` e `npm test` em apps/api (1 teste passou). Não rodei o e2e, como você pediu.

## Apontamentos (bloqueiam)
Nenhum.

Conferência contra o `architecture.md`:
- **Camadas (§2.1):** o guard chama `UsersService.findById`, o service chama `UsersRepository.findById`, e só o repository toca o `PrismaService`. O `AuthModule` usa o `UsersModule` pelo service exportado (`exports: [UsersService]`), não pelo repository.
- **Autenticação (§2.1):** o `JwtAuthGuard` é global via `APP_GUARD`. `@Public()` está só em `register` e `login`. O guard recusa `tokenVersion` divergente e usuário inexistente. O 401 sai pelo `UnauthorizedException`, então o filtro global o põe no formato do envelope, com `message` em português e sem vazar detalhe. O `/auth/me` devolve `{ id, email }` sem `passwordHash`, e o interceptor o embrulha em `data`.
- **Segredo:** nenhum segredo no código. O `JwtService` usa a configuração do `JwtModule`, e o teste lê `JWT_SECRET` do `ConfigService`.
- **Erro:** o `catch` do `verifyAsync` converte a falha em 401 de propósito, sem engolir nada.
- **Dependências (§2):** `cookie-parser` (linha 36) e `@types/cookie-parser` (linha 48) já estão no `package.json`. A divergência "package.json inalterado" é coerente, porque a dependência já estava declarada.

**As 3 divergências do plan:**
- **`cookie-parser` em `setup-app.ts` em vez de `main.ts`:** coerente. O `main.ts` só chama `configureApp`, e o e2e usa a mesma função. Se o `app.use(cookieParser())` ficasse no `main.ts`, o e2e rodaria sem ele e o guard nunca leria o cookie. O §3 diz que o `main.ts` é o bootstrap, mas a convenção já adotada nas tarefas anteriores (pipe, filtro, interceptor) é o `configureApp`.
- **`APP_GUARD` em `auth.module.ts` em vez de `app.module.ts`:** coerente. O guard depende de `JwtService` e `UsersService`, que o `AuthModule` já resolve. No `AppModule` seria preciso reexportar o `JwtModule`. O efeito é global do mesmo jeito.
- **`GET /` agora responde 401:** isso é consequência direta do §2.1 (guard global, rota aberta só com `@Public()`). Não é defeito do diff. A decisão sobre a rota é do usuário.

## Sugestões (não bloqueiam)
- `apps/api/src/auth/auth.controller.ts`, no `me`: o tipo `Request & { user: ... }` usa o `Request` global (Fetch), porque o arquivo só importa `Response` do express. Compila e funciona, mas o tipo é enganoso. Sugiro `import type { Request, Response } from 'express'`.
- O `request.user` é montado no guard com cast (`Request & { user?: unknown }`) e relido no controller com outro tipo. Um tipo compartilhado (por exemplo `AuthenticatedRequest`), ou um decorator `@CurrentUser()` quando a segunda rota privada aparecer, tiraria a duplicação. Hoje há um uso só, então não é abstração obrigatória.
- `apps/api/test/app.e2e-spec.ts`: o teste de `GET /` passou a afirmar 401 com um TODO. Isso trava no teste uma rota de scaffold (Hello World). Depois que o usuário decidir, o melhor é apagar a rota e o teste, ou marcar o `AppController` com `@Public()` e voltar ao 200.
- O guard mora em `auth/`, e o §3 lista "guards" em `common/`. Fica coerente por ser o guard do domínio de autenticação. Se o `PremiumGuard` entrar depois, vale decidir o lugar de ambos.
- O §2.1 manda rotas autenticadas declararem `@ApiCookieAuth()`. O Swagger ainda não está instalado, então isso fica para quando ele entrar. Não é desta tarefa.
- Não há teste unitário do guard. A cobertura e2e é boa: sem cookie, adulterado, lixo, expirado, `tokenVersion` divergente, usuário inexistente, sessão válida, e `register`/`login` abertas. Os e2e dependem de Postgres e não rodam no `npm test`.

## Observações fora do escopo deste diff
- O cookie de sessão é `httpOnly`, mas o texto do §2.1 também exige `Secure` e `SameSite`. Isso é da Tarefa 5 (login) e não foi tocado aqui. Vale conferir em `session.constants.ts` ou no `auth.controller.ts`.
- O logout, que incrementa `tokenVersion`, ainda não existe. O guard já está pronto para ele.

Arquivos revisados:
- `apps/api/src/auth/jwt-auth.guard.ts`
- `apps/api/src/auth/public.decorator.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/common/setup-app.ts`
- `apps/api/src/users/users.service.ts`
- `apps/api/src/users/users.repository.ts`
- `apps/api/test/auth-me.e2e-spec.ts`
- `apps/api/test/app.e2e-spec.ts`
