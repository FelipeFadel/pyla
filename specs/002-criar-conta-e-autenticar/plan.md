# Plano — Issue #2

## Decisões técnicas

**Entidade e banco**
- Model `User` (architecture §5.1): `id`, `email` (único), `passwordHash`, `tokenVersion` (começa em 0), `createdAt`. Primeira migration do projeto.
- A unicidade do e-mail é garantida pelo banco (`@unique`). O código **não** faz "busca antes de criar": o erro `P2002` do Prisma é o caminho do e-mail repetido, o que fecha a corrida do CA9.
- Nada de `Subscription` aqui: a conta é gratuita por não ter assinatura.

**Contrato da API** (módulo `auth`, mais um módulo `users` para o repository do `User`)
- `POST /auth/register` (aberta): cria a conta e já emite o cookie (CA1).
- `POST /auth/login` (aberta): emite o cookie (CA5).
- `GET /auth/me` (autenticada): devolve `{ id, email }`, nunca o hash. É a "consulta à sessão atual" do CA5 e o que o front usa para saber se há sessão.
- `POST /auth/logout` (autenticada): incrementa `tokenVersion` e limpa o cookie (CA8). Com token inválido, o guard responde 401 antes de chegar ao logout.
- Resposta de sucesso sempre em `{ data }` e erro no formato do architecture §2.1, com `message` em português.

**Cookie e token**
- Cookie `pyla_session`, `httpOnly`, `SameSite=Lax` (valor provisório; o ajuste para domínios diferentes é do deploy, fora de escopo), `Secure` só quando `NODE_ENV=production` (em `http://localhost` o navegador não aceitaria `Secure` em todos os casos; o valor de produção é conferido na Atividade 15).
- O JWT carrega `sub` e `tokenVersion`, com `exp` de 7 dias, igual ao `maxAge` do cookie.
- O `JwtAuthGuard` global lê o cookie com `cookie-parser`, verifica a assinatura e compara `tokenVersion` do token com o do banco (uma consulta por requisição autenticada).
- **Dependência nova fora do architecture:** `cookie-parser` (e `@types/cookie-parser`). Ela é registrada no `architecture.md` §2 na Tarefa 2, antes de ser usada.

**Validação e mensagens (resolve as ambiguidades apontadas na revisão da spec)**
- CA2 × CA3: e-mail repetido recebe mensagem genérica que não cita o e-mail, e **só** esse caso usa a genérica. Erro de formato recebe `details` por campo.
- E-mail normalizado no DTO (`trim` + minúsculas) antes de validar e gravar; vale também no login.
- Senha no cadastro: mínimo 8, ao menos uma letra (`\p{L}`, inclui acentuadas) e um número, máximo medido em **bytes UTF-8** (72), porque é isso que o `bcrypt` considera. Para texto ASCII, 72 bytes são 72 caracteres. O `maxLength` do campo no front é 72 caracteres e a API dá a palavra final.
- Login: o DTO só exige e-mail em formato válido e senha não vazia. Ele **não** aplica a política de senha, para não revelar a regra. Formato inválido é 400; credencial errada ou e-mail inexistente é 401 com a mesma mensagem (CA6).
- Para não distinguir "e-mail inexistente" pelo tempo de resposta, o login compara a senha com um hash falso quando o e-mail não existe.

**Front**
- O cliente HTTP de `shared/` envia `credentials: 'include'`, converte `{ data }` e o erro, e em **401 leva ao login, exceto** nas chamadas a `/auth/login`, `/auth/register` e `/auth/me`. Sem essa exceção, o 401 do login recarregaria a tela em vez de mostrar "credenciais inválidas", e `/auth/me` com 401 (visitante) entraria em laço.
- Estilo só com Tailwind e os tokens de `design-tokens.md` em `@theme` (architecture §4). React Router com lazy loading por feature.
- Testes de tela usam consultas por papel e rótulo do Testing Library, sem biblioteca extra.

**Testes de integração**
- Os testes e2e da API usam o Postgres do `docker-compose.yml` e **apagam a tabela `User` antes de cada teste**. Eles não devem rodar contra um banco com dados que importem. A esteira de CI (Atividade 11) usará um branch do Neon, conforme architecture §5.3.

## Tarefas

- [x] **Tarefa 1 — Criar o model User e o PrismaService**
  - Cobre: passo técnico (destrava CA1, CA2, CA4 e CA9; fecha a pendência 3 do architecture §7.1)
  - Teste primeiro: teste de integração que usa o `UsersRepository`/`PrismaService` para criar dois usuários com o mesmo e-mail e espera `P2002` no segundo. Falha antes porque o model e a migration não existem.
  - Arquivos previstos: `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/users/users.module.ts`, `apps/api/src/users/users.repository.ts`, teste ao lado

- [x] **Tarefa 2 — Montar a base global da API**
  - Cobre: passo técnico (destrava CA3, CA7 e a resposta de todos os CAs)
  - Teste primeiro: e2e que prova (a) campo extra ou inválido vira 400 com `details` por campo, (b) sucesso volta em `{ data }`, (c) erro desconhecido vira 500 genérico sem stack, (d) o boot falha sem `JWT_SECRET`. Falha antes porque nada disso existe no `main.ts`.
  - Arquivos previstos: `apps/api/src/main.ts`, `apps/api/src/config/` (validação das variáveis), `apps/api/src/common/` (interceptor e filtro), `apps/api/.env.example` (`JWT_SECRET`, `WEB_ORIGIN`), `docs/architecture.md` §2 (registrar `cookie-parser`), `apps/api/package.json`

- [x] **Tarefa 3 — Cadastrar usuário**
  - Cobre: CA1, CA3, CA4
  - Teste primeiro: e2e que envia cadastro válido e espera 201, `Set-Cookie` com `HttpOnly`, corpo sem `passwordHash`, e no banco só o hash; depois e-mails e senhas inválidos (7, 73 bytes, sem letra, sem número) esperando 400 com o campo e nada gravado. Falha antes porque a rota não existe.
  - Arquivos previstos: `apps/api/src/auth/` (controller, service, DTO de cadastro), `apps/api/src/users/users.repository.ts`, `apps/api/package.json` (`bcrypt`, `@nestjs/jwt`, `class-validator`, `class-transformer`)

- [x] **Tarefa 4 — Recusar e-mail repetido**
  - Cobre: CA2, CA9
  - Teste primeiro: e2e que cadastra `a@x.com`, cadastra de novo (e com ` A@X.com `) esperando 400 genérico sem o e-mail e uma só linha no banco; e dois cadastros simultâneos (`Promise.all`) com um 201 e um 400. Falha antes porque o `P2002` ainda vira 500.
  - Arquivos previstos: `apps/api/src/auth/auth.service.ts`, `apps/api/src/common/` (tradução do `P2002` no filtro)

- [ ] **Tarefa 5 — Fazer login**
  - Cobre: CA5 (cookie de 7 dias), CA6
  - Teste primeiro: e2e que faz login com e-mail em outra capitalização e espera 200 com `Set-Cookie` `HttpOnly` e `Max-Age` de 7 dias; senha errada e e-mail inexistente esperando 401 com mensagem idêntica e sem cookie. Falha antes porque a rota não existe.
  - Arquivos previstos: `apps/api/src/auth/` (rota, DTO de login, service)

- [ ] **Tarefa 6 — Proteger as rotas e consultar a sessão**
  - Cobre: CA7, CA5 (consulta à sessão atual)
  - Teste primeiro: e2e que chama `GET /auth/me` sem cookie, com cookie adulterado e com token expirado esperando 401, e com sessão válida esperando 200 com `{ id, email }`; e que `register` e `login` continuam abertas. Falha antes porque não há guard.
  - Arquivos previstos: `apps/api/src/auth/jwt-auth.guard.ts`, `apps/api/src/auth/public.decorator.ts`, `apps/api/src/app.module.ts` (`APP_GUARD`), `apps/api/src/main.ts` (`cookie-parser`), `apps/api/package.json`

- [ ] **Tarefa 7 — Fazer logout**
  - Cobre: CA8
  - Teste primeiro: e2e que faz login em dois "dispositivos" (dois tokens), faz logout com o primeiro e espera 200 com cookie limpo, e que o primeiro e o segundo recebem 401 em `GET /auth/me`. Falha antes porque a rota não existe.
  - Arquivos previstos: `apps/api/src/auth/` (rota e service), `apps/api/src/users/users.repository.ts` (incrementar `tokenVersion`)

- [ ] **Tarefa 8 — Preparar o front: estilo, rotas e cliente HTTP**
  - Cobre: passo técnico (destrava CA1, CA5, CA6, CA7, CA10 e CA11 no front)
  - Teste primeiro: teste do cliente HTTP que prova `credentials: 'include'`, a conversão de `{ data }` e do erro, e o redirecionamento ao login em 401 **exceto** nas chamadas de `/auth/login`, `/auth/register` e `/auth/me`. Falha antes porque o cliente não existe.
  - Arquivos previstos: `apps/web/vite.config.ts`, `apps/web/src/index.css` (`@theme` com os tokens), `apps/web/src/main.tsx`, `apps/web/src/app/` (rotas), `apps/web/src/shared/http/`, `apps/web/package.json` (`react-router`, `tailwindcss`, `@tailwindcss/vite`)

- [ ] **Tarefa 9 — Criar as telas de cadastro e de login**
  - Cobre: CA1, CA5, CA6 (na tela), CA10, CA11
  - Teste primeiro: testes de componente por papel e rótulo: campo de senha com `maxlength` 72, rótulo em todo campo, erro ligado ao campo por `aria-describedby`, envio por teclado, mensagem de erro em português e formulário preservado quando a requisição falha (rede), e erro genérico do login sem recarregar a tela. Falha antes porque as telas não existem.
  - Arquivos previstos: `apps/web/src/features/auth/pages/`, `apps/web/src/features/auth/components/`, `apps/web/src/features/auth/api/`, testes ao lado

- [ ] **Tarefa 10 — Criar a área interna, a rota protegida e o logout**
  - Cobre: CA7 (no front), CA8 (no front)
  - Teste primeiro: teste de componente em que visitante sem sessão (`/auth/me` com 401) que abre a área interna é levado ao login; usuário com sessão vê a página mínima com o e-mail dele; o botão de logout chama a API e leva ao login. Falha antes porque a rota protegida não existe.
  - Arquivos previstos: `apps/web/src/features/auth/pages/`, `apps/web/src/features/auth/api/` (hook de sessão), `apps/web/src/app/` (rota protegida)

## Critérios sem tarefa

-
