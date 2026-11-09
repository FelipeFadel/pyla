# Parecer de Código — Tarefa 11

**Veredito:** APROVADO

Rodei em apps/web: `npm test` (45 passam), `npm run lint` (limpo) e `npm run build` (`tsc -b && vite build`, ok).

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
1. **O Tailwind escaneia o próprio teste e vaza CSS morto para o bundle.** O CSS de produção `dist/assets/index-*.css` contém `max-w-md`, `h-xl`, `size-sm` e `min-w-xs`. Essas classes vêm dos literais do teste `apps/web/src/index.css.test.ts`, porque o Tailwind v4 varre todo arquivo em `src`. Não há bug: nenhum JSX usa essas classes. Mas é exatamente a classe `max-w-md` quebrada (24px) que o teste proíbe, agora no CSS final. Para evitar, adicione `@source not "./**/*.test.ts";` no `index.css`, ou monte as strings do teste por concatenação (`'max-' + 'w-md'`). Hoje o prejuízo é só alguns bytes e confusão ao inspecionar o CSS.
2. **`/// <reference types="node" />` no topo do teste (`index.css.test.ts:1`) é aceitável.**
   - `tsconfig.app.json` tem `types: ["vite/client"]`, então sem a diretiva `node:fs` não tipa.
   - A diretiva vale só para esse arquivo. Não altera o tsconfig do app, e o `tsc -b` passou.
   - Ela puxa os tipos globais do Node para o programa de typecheck do app inteiro. Na prática, `process` e `Buffer` passam a tipar em qualquer arquivo de `src`, inclusive de produção.
   - A alternativa mais limpa seria um `tsconfig.test.json` separado ou `types: ["vite/client", "node"]` com os testes excluídos do app. Para um arquivo só, não vale a indireção.
3. **A regex é robusta o bastante.**
   - Cobre as variantes empilhadas (`sm:`, `md:hover:`), além de `min-w-`, `h-` e `size-`.
   - O lookbehind `(?<![\w-])` evita contar o `w-` dentro de `max-w-` e não casa `gap-md` nem `p-sm`.
   - `max-w-formulario` e `w-full` passam.
   - O teste da própria regex (`it.each`) documenta isso.
   - Lacunas aceitáveis: ela não pega classe com `!` (importante) ou `-` (negativa) antes do nome (`!max-w-md`, `-mt-md`). Também não pega `max-h-`, `basis-`, `inset-` ou `top-`, que são outras famílias que leem `--spacing`. `max-h-md` e `min-h-md` não estão cobertos. Se quiser fechar, inclua `max-h|min-h` na alternância.
   - Como o teste lê `.tsx` cru, comentários e strings podem dar falso positivo. Hoje o resultado é 0 e o falso positivo é seguro, porque erra para o lado de bloquear.
4. **A varredura ignora `.test.tsx` mas pega `.ts` e `.jsx`?** Ela só olha `.tsx`, o que bate com o texto da tarefa. Se aparecer `.ts` ou `.jsx` com classes, ficam fora. Vale só se o projeto passar a ter isso.
5. **O regex do `@theme` (`/@theme\s*\{[\s\S]*?\n\}/`) é frágil.** Depende de o `}` de fechamento estar no início da linha. Hoje funciona. Se alguém indentar, o teste falha de forma ruidosa, o que é seguro.

## Checagens pedidas
- **architecture §4 (estilo só com tokens em `@theme`):** respeitada. `--container-formulario` fica no `@theme` e o JSX usa `max-w-formulario`. Não há valor literal em classe.
- **Caminho relativo ao arquivo:** correto. Usa `dirname(fileURLToPath(import.meta.url))`, sem depender do cwd.
- **Teste em `src/` e build:** o `tsc -b` o tipa e passa. O Vite não o inclui nos chunks JS, porque ninguém o importa, e o vitest o roda normalmente. Ressalva: o CSS é varrido, como descrito na sugestão 1.
- **Nome `formulario` em HomePage e RequireSession:** é semanticamente impreciso, pois a HomePage e a tela de erro não são formulário. Mas é um único token de largura de coluna das telas, sem duplicação. Se isso incomodar, `--container-tela` seria mais fiel. Trocar é opcional e é preferência de nome, não apontamento.
- **Comentário no `@theme`:** claro e explica o porquê, a colisão com `--spacing-md`.

## Observações fora do escopo deste diff
- A mesma colisão vale para qualquer utilitário de tamanho que leia `--spacing-*` (`max-h-`, `basis-`, `inset-`, `top-`). Uma Issue de manutenção poderia cobrir a regra de forma mais geral, por exemplo com um lint de classes.

Arquivos: `apps/web/src/index.css.test.ts`, `apps/web/src/index.css`.
