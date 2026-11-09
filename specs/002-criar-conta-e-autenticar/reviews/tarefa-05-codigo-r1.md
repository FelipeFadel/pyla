# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

Verifiquei o diff inteiro contra `docs/architecture.md` §2.1. `npm test` (unit) passou, com 1 arquivo e 1 teste. Não rodei o e2e, como combinado. Li `auth-login.e2e-spec.ts` e ele cobre o que a tarefa pede.

Não encontrei nada que reprove:
- **Camadas:** o fluxo é `AuthController` → `AuthService` → `UsersService` → `UsersRepository` → `PrismaService`. O controller só monta o cookie e chama o service. `auth.service.ts` não importa Prisma. O módulo de auth usa o `UsersService`, não o repository.
- **Entrada:** `LoginDto` fica em `auth/dto/`, com `class-validator`. Ele não aplica política de senha, de propósito, e o teste "senha fraca errada é 401, não 400" cobre isso.
- **Formato de erro:** `UnauthorizedException({ message })` passa pelo `customPart` do filtro global (`http-exception.filter.ts:87-101`). O corpo sai no formato `{ statusCode, error, message, path, timestamp }`, com mensagem em português. As duas falhas de login usam a mesma constante `INVALID_CREDENTIALS_MESSAGE`.
- **CA6:** o `compare` roda sempre, com um hash falso quando o usuário não existe. Isso iguala o tempo de resposta e evita enumerar e-mails.
- **Segredos:** `FAKE_PASSWORD_HASH` é um hash descartável e não dá acesso a nada. `secure` do cookie vem do `ConfigService`.
- **Cookie:** `setSessionCookie` foi extraído e é usado pelas duas rotas (register e login), então não é abstração para um caso só.
- **Testes:** verificam comportamento observável (status, cabeçalho, corpo). Não dependem de detalhe interno.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- A assinatura do JWT está duplicada em `auth.service.ts:27-30` e `auth.service.ts:44-47`, junto com o `{ id, email }` do retorno. Um helper privado (`issueSession(user)`) evitaria que `register` e `login` divergissem. Serve também para o futuro `tokenVersion`/logout. A duplicação é pequena, por isso fica como sugestão.
- O `@Transform` que normaliza o e-mail é igual em `login.dto.ts` e `register.dto.ts`. Se a regra de normalização mudar (por exemplo, o tratamento de Unicode), um dos dois pode ficar para trás e o login deixa de achar usuários cadastrados. Dá para extrair um decorator ou função compartilhada em `auth/dto/`.
- `sameSite: 'lax'` (`auth.controller.ts`) está abaixo do que §2.1 e §7 sugerem para duas origens (Vercel e Render). A §7 pede "`SameSite` adequado" para o cookie cruzando origem. Isso veio do cadastro (Tarefa 3) e não do diff desta tarefa, mas vale revisar antes do deploy.

## Observações fora do escopo deste diff
- Possível Issue de manutenção: o `SameSite` do cookie para o deploy em duas origens (veja a sugestão acima).
- `JwtAuthGuard` global e `@Public()` ainda não existem no diff. Quando o guard entrar, `register` e `login` precisam ser marcados `@Public()` (§2.1, "Autenticação e acesso").
