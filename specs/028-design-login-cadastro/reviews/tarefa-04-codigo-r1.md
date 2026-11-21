# Parecer de Código — Tarefa 4

**Veredito:** APROVADO (sem apontamentos bloqueantes)

Verificações: `npm test` passou (6 arquivos, 57 testes). `npm run lint` não reportou nada. `npm run build` terminou sem erro. Não editei nenhum arquivo.

## Apontamentos (bloqueiam)
Nenhum.

## O que conferi
- **Classes geradas no build:** procurei cada classe no CSS de `dist`. Todas geram regra: `pr-xl`, `pr-sm`, `pl-sm`, `px-xs`, `right-0`, `inset-y-0`, `relative`, `absolute`, `w-full`, `text-texto-suave`, `items-center`. `h-5` e `w-5` também geram, porque `--spacing:.25rem` existe no CSS final. Não há valor literal no JSX. `index.css.test.ts` passa, e `w-full` e `h-5` não casam com a regex de nome de espaçamento como largura.
- **Foco:** o `:focus-visible` global em `apps/web/src/index.css:60-63` está no `@layer base` e aparece no CSS final. Ele cobre o botão, porque não depende do elemento. O botão não tem `outline-none` nem sobrescrita. Ele vem depois do input no DOM, então o foco passa pelo campo e depois pelo botão, antes do submit.
- **Botão** (`FormField.tsx:73-81`): tem `type="button"`, então não envia o formulário. O teste do cadastro confirma isso com `fetchMock` não chamado. O nome acessível muda com o estado, há `aria-pressed`, e o SVG tem `aria-hidden` e `focusable="false"`.
- **`aria-describedby`** (`FormField.tsx:51`): o erro tem prioridade sobre a dica. Os ids `${id}-erro` e `${id}-dica` são únicos por campo. O id só é referenciado quando o elemento existe, porque `hint` e `errors` condicionam os dois lados.
- **Login:** não passa `passwordHint`, então não mostra a política. O teste cobre isso com `not.toHaveAccessibleDescription` e `queryByText`.
- **Estado de UI:** `useState` fica no `FormField`, como manda o §4. O estado `visible` persiste depois do erro, porque o campo não é remontado: `AuthForm` não usa `key` nem troca a árvore. Só o campo de senha recebe o botão (`type === 'password'`).
- **Código morto:** não encontrei.
- **Testes:** usam papel e rótulo (`getByRole('button', { name })`, `getByLabelText`, `toHaveAccessibleDescription`). Não dependem de classe nem de implementação interna.

## Sugestões (não bloqueiam)
- **Nome e `aria-pressed` juntos** (`FormField.tsx:75-76`): o botão troca o rótulo ("Mostrar" e "Ocultar") e também usa `aria-pressed`. Pela prática WAI-ARIA, é um ou outro: com o rótulo mudando, leitores de tela podem anunciar "Ocultar senha, pressionado". Mas o plan.md pede `aria-pressed` e o nome que muda, então fica como está a menos que você queira revisar o plano.
- **`h-5 w-5` no ícone** (`FormField.tsx:25`): é a escala numérica padrão do Tailwind, não um token do `design-tokens.md`. Funciona e não viola a regra de nome de espaçamento, mas, estritamente, não é "só classes dos tokens". Se quiser rigor, dá para criar um token de tamanho de ícone.
- **Falta teste de regressão para a sua preocupação:** nenhum teste alterna a visibilidade depois de um erro de validação. O código está correto, mas isso não está provado por teste. Um teste curto (erro, depois clicar em "Mostrar senha" e checar `type="text"`) travaria o comportamento.
- **Teste do login:** ele confere só o `type="text"` ao mostrar. Não confere a volta para `password`. O teste do cadastro já cobre isso, então a cobertura está duplicada e leve.
- **Ternário aninhado** (`FormField.tsx:51`, `hasError ? errorId : hint ? hintId : undefined`): legível hoje, mas se crescer vale extrair para uma função.

## Observações fora do escopo deste diff
- Nenhuma para Issue de manutenção.
