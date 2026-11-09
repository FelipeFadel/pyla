# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Tarefa 11: o `@theme` declara `--container-formulario` com 28rem | atendido | `apps/web/src/index.css:30-31`. O teste confere em `index.css.test.ts:48-52`. |
| Tarefa 11: nenhum `.tsx` de `apps/web/src` usa `max-w-`, `w-`, `min-w-`, `h-` ou `size-` com xxs, xs, sm, md, lg ou xl | atendido | Os três arquivos agora usam `max-w-formulario` (`AuthForm.tsx:48`, `HomePage.tsx:29`, `RequireSession.tsx:22`). O teste de varredura está em `index.css.test.ts:54-59`. |
| Tarefa 11: a tela deixa de ter 24px de largura | atendido | O CSS gerado em `dist/assets` tem `.max-w-formulario{max-width:var(--container-formulario)}` e `--container-formulario:28rem`. |
| Escopo: só os 5 arquivos previstos | atendido | `git diff --stat` mostra exatamente `index.css`, `index.css.test.ts`, `AuthForm.tsx`, `HomePage.tsx` e `RequireSession.tsx`. Cada `.tsx` tem uma linha trocada. |
| CA1, CA5, CA6, CA7, CA8, CA10 e CA11 (telas utilizáveis) | atendido, sem regressão | A mudança é só de classe CSS. Rótulos, `maxLength` e a lógica de erro não foram tocados. Os 45 testes passam. |
| CA2, CA3, CA4 e CA9 | fora desta tarefa | São critérios de API. |

Comandos que rodei em `apps/web`:
- `npm test`: 5 arquivos e 45 testes passaram.
- `npm run lint`: sem erros.
- `npm run build`: concluiu com sucesso.
- Grep em `apps/web/src` por `(max-w|min-w|w|h|size|min-h|max-h)-(xxs|xs|sm|md|lg|xl|2xl|3xl)`: só há ocorrências em `index.css.test.ts` (linhas 28 e 42, que são casos de teste do regex) e no comentário de `index.css:30`. Nenhum `.tsx` tem uso.

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: o CSS gerado ainda contém `.max-w-md{max-width:var(--spacing-md)}`. O Tailwind lê o texto "max-w-md" no comentário do `index.css` e nos casos de teste de `index.css.test.ts`, e gera a classe, que nenhum componente usa. Ela não afeta nenhuma tela. Quem decide se vale reescrever o comentário ou o teste é o revisor de código ou o usuário.
