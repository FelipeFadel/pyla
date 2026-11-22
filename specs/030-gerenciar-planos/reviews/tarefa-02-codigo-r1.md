# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

Rodei `npm run lint -w apps/api` (limpo) e `npm test -w apps/api` (1 de 1 passou). Não rodei o e2e. Avaliei `roles.e2e-spec.ts` por leitura.

## Apontamentos (bloqueiam)
Nenhum.

Conferi item a item:
- **Camadas:** o guard não toca banco nem Prisma. Ele só lê `request.user`, que o `JwtAuthGuard` preenche com `role` vindo do banco a cada requisição. Por isso o CA16 (rebaixamento) vale sem consulta extra.
- **`Reflector` e `APP_GUARD`:** `getAllAndOverride` com `[handler, class]` segue o padrão do `JwtAuthGuard`. Em `auth.module.ts:27-28` os dois `APP_GUARD` estão em ordem, JWT primeiro e Roles depois. O Nest executa guards globais na ordem de registro, então o 401 vem antes do 403.
- **Rota `@Public`:** o `RolesGuard` retorna `true` antes de olhar `@Roles` (`roles.guard.ts:21-23`). Rota pública não gera 500 por falta de `user`.
- **Request sem `user`:** com `@Roles` e sem `user`, o guard lança 403 (`roles.guard.ts:34`). É uma negação por padrão, que é a escolha segura. Na prática o `JwtAuthGuard` já barra antes com 401.
- **403 e filtro global:** `http-exception.filter.ts:24` já mapeia 403 para `error: 'Forbidden'` e `message: 'Acesso negado.'`, em português. O formato do §2.1 é mantido.
- **Tipagem:** não há `any`. `Role` é importado como `type`. A tipagem inline de `Request & { user?: ... }` espelha o cast que o `JwtAuthGuard` já faz.
- **Isolamento do teste:** o `RolesProbeController` existe só no arquivo de teste e entra via `controllers:` no `createTestingModule`. Não há rota de teste em `src/`.
- **Teste e acoplamento:** o teste exercita o guard global real via HTTP, sem mock do guard. O 403 é verificado no formato do filtro. O CA16 usa a mesma sessão e rebaixa o papel direto no banco.

## Sugestões (não bloqueiam)
- `roles.e2e-spec.ts:138-142` é redundante com o teste `:83-86`. Os dois chamam `/roles-probe/admin` sem sessão e esperam 401. O `not.toBe(500)` não acrescenta nada. Dá para remover, ou transformar em um caso distinto.
- `roles.guard.ts:35` repete a string `'Acesso negado.'`, que o filtro já fornece como padrão do 403. Dá para lançar `new ForbiddenException()` e deixar o filtro decidir. É uma única fonte de mensagem, mas hoje a duplicação é inofensiva.
- `roles.guard.ts:29`: o `roles.length === 0` trata `@Roles()` vazio como "sem restrição". Isso é fail-open para um decorador mal usado. Considere tratar lista vazia como negação, ou documentar a escolha em comentário.
- O `docs/architecture.md` §2.1 (Autenticação) não menciona `RolesGuard`/`@Roles`. Vale atualizar o doc quando o fluxo permitir, por exemplo ao fechar o CA13 na tarefa dos endpoints. O fluxo não deveria editar o doc por conta própria.
- `roles.e2e-spec.ts:75-77`: o parse do cookie `set-cookie` pode ser reaproveitado se já existir um helper nos outros e2e (`auth-me`, `auth-register`). Não verifiquei se existe.

## Observações fora do escopo deste diff
- Nenhuma.

Arquivos revisados:
- `c:\Users\Usuário\pyla\apps\api\src\auth\roles.guard.ts`
- `c:\Users\Usuário\pyla\apps\api\src\auth\roles.decorator.ts`
- `c:\Users\Usuário\pyla\apps\api\src\auth\auth.module.ts`
- `c:\Users\Usuário\pyla\apps\api\test\roles.e2e-spec.ts`
