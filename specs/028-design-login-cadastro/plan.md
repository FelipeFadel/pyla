# Plano — Issue #28 (Task de manutenção, sem spec)

Aplicar o design do Stitch (`docs/design/stitch/login-e-criar-conta.html`) às telas de login e cadastro já existentes. **Não muda comportamento nem regra de negócio.**

Os "critérios" abaixo são os itens "Como saber que ficou pronto" da issue #28:

- **P1** — login inválido continua com mensagem genérica (já coberto pelos testes atuais; não podem quebrar).
- **P2** — e-mail repetido continua exibindo a mensagem da API, sem revelar que o e-mail existe (o front só renderiza `error.message`; nada a mudar).
- **P3** — `npm test` e `npm run lint` verdes em cada tarefa.
- **P4** — visual fiel ao protótipo (conferido por você no navegador, ao fim).

## Decisões técnicas

- **Sem rota nova, sem chamada de API nova.** `LoginPage`, `RegisterPage`, `authApi` e o cliente HTTP não mudam.
- **Fonte:** a Saira vale, não a Chivo/Work Sans do protótipo (`design-tokens.md`). Pacotes `@fontsource/saira` e `@fontsource/saira-stencil-one`, importados no CSS, sem CDN. Dependência nova: registrar no `architecture.md` §2 na Tarefa 1, antes de usar (como foi feito com `cookie-parser`).
- **Token novo:** `--shadow-card` no `@theme` e uma linha em `design-tokens.md`. Nenhuma cor, sombra ou espaçamento literal no JSX (architecture §4).
- **Abas são links** (`<Link>`/`aria-current="page"`), não botões: mantêm as duas rotas com lazy loading e não colidem com `getByRole('button', { name: 'Entrar' })` dos testes. As páginas passam os destinos ao componente; `components/` não hardcoda rota.
- **Ícones em SVG inline**, `aria-hidden`, sempre acompanhados de texto (erro não é só cor).
- **Dica de senha × erro:** o `aria-describedby` do campo aponta para o erro quando há erro; sem erro, aponta para a dica. Assim o teste existente de `toHaveAccessibleDescription` do erro continua valendo.
- **Marca:** "Pyla" é o `h1` (título da página em `font-display`); os rótulos "Entrar"/"Criar conta" ficam nas abas. Os testes atuais não consultam o `h1` das telas de auth.
- **Não entram:** nome, termos, confirmar senha, logo com ícone, "esqueci minha senha", simulador de erros do protótipo.

## Tarefas

- [x] **Tarefa 1 — Carregar a fonte Saira e criar o token de sombra**
  - Cobre: P3, P4
  - Teste primeiro: em `index.css.test.ts`, o `@theme` declara `--shadow-card` e o CSS importa `@fontsource/saira` e `@fontsource/saira-stencil-one`. Falha antes porque nada disso existe.
  - Arquivos previstos: `apps/web/src/index.css`, `apps/web/src/index.css.test.ts`, `apps/web/package.json`, `docs/design-tokens.md` (linha do token de sombra), `docs/architecture.md` §2 (registrar os pacotes)

- [x] **Tarefa 2 — Montar o card com a marca e o subtítulo**
  - Cobre: P3, P4
  - Teste primeiro: nas duas páginas, `getByRole('heading', { name: 'Pyla' })`, o texto "Inteligência financeira em compras de mercado" e os placeholders "seu@email.com" (e-mail) e "••••••••" (senha). Falha antes porque o título atual é "Entrar"/"Criar conta" e os campos não têm placeholder.
  - Arquivos previstos: `apps/web/src/features/auth/components/AuthForm.tsx`, `FormField.tsx` (aparência do input), testes ao lado

- [x] **Tarefa 3 — Navegar entre as telas por abas e pelo link do rodapé**
  - Cobre: P3, P4
  - Teste primeiro: em `/login`, `getByRole('link', { name: 'Criar conta' })` existe, a aba "Entrar" tem `aria-current="page"` e clicar na outra leva a `/cadastro` (e o inverso); o rodapé "Não tem uma conta? / Já tem uma conta?" faz o mesmo. Falha antes porque não há links.
  - Arquivos previstos: `apps/web/src/features/auth/components/AuthTabs.tsx` (novo), `AuthForm.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, testes ao lado

- [x] **Tarefa 4 — Mostrar/ocultar a senha e exibir a dica da política**
  - Cobre: P3, P4
  - Teste primeiro: o botão "Mostrar senha" troca o `type` do campo entre `password` e `text` (com `aria-pressed`); no cadastro, o campo de senha tem a descrição acessível "mínimo 8 caracteres, com letra e número", e no login não tem; com erro de validação a descrição volta a ser só a do erro. O `getByLabelText('Senha')` e o `maxlength` 72 continuam valendo. Falha antes porque o botão e a dica não existem.
  - Arquivos previstos: `apps/web/src/features/auth/components/FormField.tsx`, `AuthForm.tsx`, testes ao lado

- [x] **Tarefa 5 — Estilizar o erro por campo e o alerta geral**
  - Cobre: P1, P2, P3, P4
  - Teste primeiro: o alerta geral (`role="alert"`) mostra o título do contexto ("Erro de autenticação" no login, "Erro no cadastro" no cadastro) seguido da mensagem da API, sem alterá-la; o campo inválido segue com `aria-invalid` e a mensagem ligada por `aria-describedby`. Falha antes porque o alerta não tem título.
  - Arquivos previstos: `apps/web/src/features/auth/components/AuthForm.tsx`, `FormField.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, testes ao lado

## Critérios sem tarefa

(vazio — P1 a P4 estão cobertos; P4 fecha com a sua conferência visual no navegador.)
