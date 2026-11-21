# Parecer de Conformidade — Tarefa 1 (issue #28, referência: plan.md)

**Veredito:** APROVADO

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| P3: `npm test` verde | atendido. 5 arquivos e 48 testes passam. | `apps/web` (rodado) |
| P3: `npm run lint` verde | atendido. O oxlint não reportou nada. | `apps/web` (rodado) |
| Teste: `@theme` declara `--shadow-card` | atendido. O teste lê o bloco `@theme` e confere o valor exato. | `apps/web/src/index.css.test.ts` (it "o @theme declara o token de sombra do card"); `apps/web/src/index.css` (`--shadow-card`) |
| Teste: o CSS importa `@fontsource/saira` e `@fontsource/saira-stencil-one` | atendido. O `it.each` confere `@import '<pacote>/`, então não aceita um import de pacote parecido. | `apps/web/src/index.css.test.ts` |
| Fonte por @fontsource, sem CDN | atendido. Os imports são 400, 600 e 700 da Saira e 400 da Stencil One. Os 4 arquivos existem em `node_modules`. | `apps/web/src/index.css` (linhas 1-4); `apps/web/package.json` (`@fontsource/saira` e `@fontsource/saira-stencil-one`, `^5.3.0`) |
| Sombra concorda no CSS, no design-tokens.md e no protótipo | atendido. O CSS e o doc têm `0 4px 12px rgba(22, 23, 43, 0.08)`. O protótipo tem `shadow-[0_4px_12px_rgba(22,23,43,0.08)]` no card. | `apps/web/src/index.css`; `docs/design-tokens.md` (seção "Sombra"); `docs/design/stitch/login-e-criar-conta.html` |
| Pacotes registrados em architecture.md §2 | atendido. Há duas linhas novas na tabela de stack do frontend. | `docs/architecture.md` (após a linha "Estilo") |
| Token documentado em design-tokens.md | atendido. A seção "Sombra" é nova e tem o nome `shadow-card`, igual ao que o Tailwind gera a partir de `--shadow-card`. | `docs/design-tokens.md` |
| Escopo | atendido. O diff toca só os arquivos previstos, mais o `package-lock.json` da raiz, que é esperado. O lock traz só as duas dependências novas. | `git diff --stat` |

## Apontamentos
Nenhum bloqueante.

Observações sem efeito sobre o veredito:
- A tarefa não fez o teste cobrir os pesos 400, 600 e 700 da Saira. Ele só confere o prefixo do pacote. O plano pedia só isso.
- Não rodei o teste antes da implementação para ver o RED. Rodei só o estado final, que está verde.
