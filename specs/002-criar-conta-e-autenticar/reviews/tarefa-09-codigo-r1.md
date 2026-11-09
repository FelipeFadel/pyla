# Parecer de Código — Tarefa 9 (rodada 1)

**Veredito:** APONTAMENTOS

Rodei `npm test` (3 arquivos, 21 testes passando), `npm run lint` (sem alertas) e `npm run build` (ok) em `apps/web`. Cada tela vira um chunk lazy: `LoginPage` e `RegisterPage` saem separados no build, e as rotas usam `import()` em `routes.tsx`.

## Apontamentos (bloqueiam)

1. **Tipografia e transição saem dos valores do `design-tokens.md` e das classes do `@theme`.**
   - Onde:
     - `apps/web/src/features/auth/components/AuthForm.tsx:47`: `text-3xl` no título.
     - `apps/web/src/features/auth/components/AuthForm.tsx:77`: `duration-100` no botão.
     - `apps/web/src/features/auth/components/FormField.tsx:44`: `text-sm` na mensagem de erro.
   - Regra violada: architecture §4 "Estilo", que diz "Só classes geradas pelos tokens de `design-tokens.md`, registrados em `@theme`". O `design-tokens.md:108` diz "Nenhum valor fora desta tabela".
   - Prejuízo concreto:
     - `text-3xl` do Tailwind padrão dá 30px. O token `titulo-pagina` é 32px (`design-tokens.md:122`).
     - `text-sm` dá 14px. Nenhum token tem esse valor: `legenda` é 13px e `corpo` é 16px.
     - `duration-100` dá 100ms. O hover do botão primário é 120ms (`design-tokens.md:161`).
     - Em `src/index.css`, o `@theme` só tem cor, espaçamento e fonte. Não há token de tamanho de texto nem de duração. As telas das próximas tarefas vão repetir o desvio, ou cada uma escolhe um valor Tailwind diferente.
   - Correção esperada: registrar os tamanhos e a duração em `@theme` (por exemplo `--text-titulo-pagina`, `--text-legenda` e uma duração de 120ms) e usar essas classes.

## Sugestões (não bloqueiam)

- **Detalhe de erro engolido em `AuthForm.tsx:29-35`.** Se a API devolver `details` não vazio, mas nenhum campo for `email` ou `password`, `fieldErrors` fica vazio e `generalError` não é definido. O usuário não vê erro nenhum. Basta cair em `generalError` quando nenhum detalhe for mapeado. Com `forbidNonWhitelisted` é improvável hoje, mas é uma falha silenciosa.
- **`testHelpers.tsx` mora em `src/features/auth/pages/`.**
  - O build não o empacota, porque ninguém de produção o importa. Conferi na lista de chunks do build.
  - O `tsc` o inclui via `include: ["src"]`, e a pasta `pages/` é de componentes ligados a rota.
  - Vale mover para `src/test/` (já existe, com o `setup.ts`) ou renomear para `*.test-utils.tsx`. A segunda tela de outra feature também vai querer esses helpers.
- **Duplicação entre `LoginPage` e `RegisterPage`.** Está bem resolvida: o `AuthForm` concentra o formulário e as duas páginas só passam título, rótulo, `autoComplete` e a chamada da API. Não é apontamento. Os testes repetem o caso de rótulo e `maxlength` nos dois arquivos, o que é aceitável.
- **O botão usa `px-sm py-xs` (16px e 8px), e o token pede `8px 20px`** (`design-tokens.md:160`). Não há token de 20px, então é só uma divergência a registrar na revisão de design.
- **Acessibilidade.** Está correta: todo campo tem `<label htmlFor>`, o erro vai ligado por `aria-describedby` e `aria-invalid`, o erro geral usa `role="alert"`, e o foco é visível por `:focus-visible` global. Opcionalmente, ao falhar o envio, mover o foco para o primeiro campo com erro.
- **Efeito colateral inofensivo:** `setSubmitting(false)` no `finally` roda depois do `navigate`. O React 19 não reclama de componente desmontado.

## Observações fora do escopo deste diff

- **`@testing-library/user-event` ^14.6.8 não está no architecture §2, linha `apps/web`.** Já é conhecido e será registrado pelo usuário. É só observação, sem bloqueio.
- **Camadas conferidas e corretas:**
  - `authApi.ts` só chama `request` de `shared/http`, sem nenhum `fetch`.
  - `useNavigate` só aparece em `pages/`. `components/` não conhece rota.
  - Nenhum `bg-[#…]` nem espaçamento literal no JSX.
  - As páginas importam o `api/` da própria feature.
- **`api/authApi.ts` tipa o retorno como `request<unknown>`.** A US02 em diante vai precisar de um tipo de usuário, e o architecture §2.2 pede tipos escritos a partir do `/docs-json`.
