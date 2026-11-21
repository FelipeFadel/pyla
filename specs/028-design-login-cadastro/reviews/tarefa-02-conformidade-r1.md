# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

`npm test` passou com 50 de 50 testes em 5 arquivos, e `npm run lint` não apontou nada. Nenhum apontamento bloqueante.

## Critérios verificados
| Critério (do plano) | Situação | Onde |
| --- | --- | --- |
| "Pyla" é o h1 nas duas páginas (marca) | atendido | `AuthForm.tsx` (header, h1 "Pyla"); `LoginPage.test.tsx` e `RegisterPage.test.tsx` (novo teste, `heading level 1 name 'Pyla'`) |
| Subtítulo "Inteligência financeira em compras de mercado" | atendido | `AuthForm.tsx` (p `text-corpo text-texto-suave`); coberto nos dois testes novos |
| Placeholders "seu@email.com" e "••••••••" | atendido | `AuthForm.tsx` (props `placeholder`) e `FormField.tsx` (nova prop repassada ao input); os testes ligam o placeholder ao campo certo com `toBe(getByLabelText(...))` |
| Card (superfície, sombra, centralizado) e aparência do input | atendido | `AuthForm.tsx` (`bg-superficie shadow-card max-w-formulario rounded`); `FormField.tsx` (borda `desabilitado`, `px-sm py-xs`, label `text-legenda`) |
| Só tokens do `@theme`, sem valor literal | atendido | Todas as classes usadas existem em `index.css` (cores, `spacing-*`, `shadow-card`, `container-formulario`, `text-legenda`, `text-corpo`, `text-titulo-pagina`). Não há valor literal no JSX. |
| Fora de escopo: abas, ícone/dica de senha, estilo de erro | atendido (nada disso entrou) | O bloco do alerta geral e a mensagem de erro por campo continuam como estavam. Não há `AuthTabs`, botão de mostrar senha nem dica. |
| P1 e P2 preservados | atendido | Os testes de login inválido genérico e de e-mail repetido seguem verdes. `LoginPage.tsx` e `RegisterPage.tsx` só perderam a prop `title`; o `onSubmit` não mudou. |
| P3: testes e lint verdes | atendido | `npm test` e `npm run lint` rodados em `apps/web` |
| P4: fidelidade visual | fora desta tarefa | Conferência visual do usuário no navegador, ao fim |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- `apps/web/src/app/routes.test.tsx` mudou, e não está entre os arquivos previstos. As asserções passaram de `heading 'Entrar'` e `heading 'Criar conta'` para `button 'Entrar'` e `button 'Criar conta'`. A mudança é consequência direta de a tarefa trocar o h1 por "Pyla", e as asserções continuam provando a mesma coisa, que a tela de login ou de cadastro foi exibida. As negativas (`queryByRole(...).not`) também ficaram equivalentes. Está justificada.
- O plano afirma que "os testes atuais não consultam o h1 das telas de auth". Isso estava impreciso, porque `routes.test.tsx` consultava. Vale corrigir a frase no `plan.md` se o plano for revisitado.
- A tarefa 2 do plano pede `getByRole('heading', { name: 'Pyla' })`, e o teste exige a mais `level: 1`. Isso é mais estrito que o plano e está correto.

Arquivos relevantes:
- `c:\Users\Usuário\pyla\apps\web\src\features\auth\components\AuthForm.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\auth\components\FormField.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\app\routes.test.tsx`
