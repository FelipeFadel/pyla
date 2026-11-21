# Parecer de Código — Tarefa 5

**Veredito:** APROVADO

Rodei `npm test` (58 de 58 passando), `npm run lint` (sem avisos) e `npm run build` (ok) em `apps/web`. Nenhum apontamento bloqueante.

## Apontamentos (bloqueiam)
Nenhum.

## O que conferi
- **Tokens e CSS gerado.** O CSS do build contém `border-perigo`, `bg-perigo-fundo`, `gap-xs`, `gap-xxs`, `items-center`, `shrink-0`, `font-semibold`, `h-4`, `w-4`, `h-5` e `w-5`. Não há valor literal no JSX.
  - `h-4`, `w-4`, `h-5` e `w-5` vêm da base `--spacing: .25rem` do Tailwind, não dos tokens `xxs` a `xl`. Isso respeita a regra testada em `index.css.test.ts`, que só proíbe `h-xs` e similares. `h-5 w-5` já era usado em `FormField.tsx:27`, então o diff não abre precedente.
- **Anúncio do alerta.** `role="alert"` está no `<div>` (`AuthForm.tsx:72`) e envolve o título e a mensagem, então os dois são anunciados juntos. A mensagem da API segue em `{generalError}` sem alteração. O SVG tem `aria-hidden` e `focusable="false"`.
- **Erro por campo.** O `id={errorId}` está no `<p>` (`FormField.tsx:93`) e o input aponta para ele por `aria-describedby`. O `<span>` interno não atrapalha: a descrição acessível continua sendo o texto da mensagem, e o teste confirma com `toHaveAccessibleDescription`.
- **Erro sem depender só de cor.** Há texto e ícone, e o `aria-invalid` já existia.
- **Contraste.** Calculei a partir de `design-tokens.md`: `#ba1a1a` sobre `#ffdad6` fica em cerca de 5:1, e sobre `#ffffff` em cerca de 6,5:1. Ambos passam em AA. A borda `perigo` sobre branco passa em 3:1 para elementos não textuais.
- **`errorTitle`.** É prop obrigatória do tipo `string` em `AuthFormProps`, e as duas páginas a passam. Não há código morto.
- **Testes.** Usam papel e texto: `findByRole('alert')`, `within(alerta)` e `toBeInvalid`. O teste de `RegisterPage.test.tsx` confere que `Senha` não recebe `border-perigo`, o que protege contra aplicar a borda a todos os campos.

## Sugestões (não bloqueiam)
- **Ícone de erro duplicado.** O mesmo SVG (círculo com exclamação) aparece em `AuthForm.tsx:73-86` e `FormField.tsx:94-107`, mudando só o tamanho. Para um ponto de reuso a duplicação é aceitável. Se surgir um terceiro uso, extraia `shared/components/ErrorIcon` com prop `className`.
- **Asserção de classe CSS.** `toHaveClass('border-perigo')` em `RegisterPage.test.tsx` (por volta da linha 152) acopla o teste ao nome do token. É aceitável porque o plano pede a borda, e o comportamento acessível já está coberto por `toBeInvalid` e `toHaveAccessibleDescription`. Não há alternativa por papel para cor de borda. Mantenha esse único `toHaveClass` e não o espalhe.
- **Asserção redundante.** Em `LoginPage.test.tsx`, `toHaveTextContent('E-mail ou senha inválidos.')` e `within(alerta).getByText(...)` conferem a mesma coisa. Dá para manter só o `getByText`.
- **Ordem das classes.** `border ${hasError ? ... }` no meio da string em `FormField.tsx:73` funciona, mas fica mais legível se a variante sair para uma constante antes do JSX.

## Observações fora do escopo deste diff
- Nenhuma.
