# Parecer de Código — Tarefa 9 (rodada 2)

**Veredito:** APROVADO

## Apontamentos (bloqueiam)
Nenhum.

## Verificação da correção do apontamento da rodada 1
- **Valores contra a tabela do design-tokens.md.** `index.css` define `--text-titulo-pagina: 2rem` (32px), `--text-titulo-card: 1.125rem` (18px), `--text-corpo: 1rem` (16px), `--text-legenda: 0.8125rem` (13px) e `--text-numero: 1.625rem` (26px). Os cinco batem com a tabela de tipografia. `--default-transition-duration: 120ms` bate com o hover de 120ms em "Estados de botão".
- **Classes realmente geradas.** Rodei `npm run build` e inspecionei `dist/assets/index-*.css`:
  - `.text-titulo-pagina{font-size:var(--text-titulo-pagina)}` e `.text-legenda{font-size:var(--text-legenda)}` existem.
  - `--default-transition-duration:.12s` está no CSS, e `.transition-colors` usa `var(--default-transition-duration)`. O hover do botão passa a levar 120ms.
- **Uso.** `AuthForm` usa `text-titulo-pagina` e `FormField` usa `text-legenda`. Não sobrou `text-3xl`, `text-sm` nem `duration-100` no diff. Não há cor nem espaçamento literal no JSX.
- **Camadas e acessibilidade.**
  - As pages chamam `features/auth/api/authApi`, que usa o `shared/http`.
  - Nenhum componente chama `fetch`.
  - `components/` (`AuthForm`) não conhece rota: a navegação fica no `onSubmit` injetado pela page.
  - Todo campo tem `<label>` associado e o erro é ligado ao campo por `aria-describedby`.
  - Os testes usam consultas por papel e rótulo.
- **Comandos (em `apps/web`).**
  - `npm test`: 3 arquivos, 21 testes, todos passam.
  - `npm run lint`: sem erros.
  - `npm run build`: ok.

## Sugestões (não bloqueiam)
Nenhuma nova. As da rodada 1 seguem recusadas e não voltam.

## Observações fora do escopo deste diff
- `--text-titulo-card`, `--text-corpo` e `--text-numero` ainda não são usados em nenhuma tela. Isso é esperado, porque as telas que os usam vêm depois.
- O `--default-transition-duration` é global e vale para qualquer `transition-*` futuro. Isso casa com a regra de estados de botão, mas vale lembrar se aparecer outra transição com duração diferente.
