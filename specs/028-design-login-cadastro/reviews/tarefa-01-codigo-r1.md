# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

Não há apontamentos bloqueantes. Rodei `npm test` (5 arquivos, 48 testes verdes), `npm run lint` (limpo) e `npm run build` (ok).

## Apontamentos (bloqueiam)
Nenhum.

## Verificações
- **Pesos no build:** o `dist/assets` contém `saira-latin-{400,600,700}`, as variantes `latin-ext` e `vietnamese` desses pesos, e `saira-stencil-one-*-400`. O peso 700 (`titulo-card`) e o 600 (`numero` e botão) estão carregados, e a Stencil One em 400 também.
- **Ordem dos `@import`:** `apps/web/src/index.css:1-5` põe os `@import` dos fontsource antes de `@import 'tailwindcss'`, e o build passou. Uma regra de CSS antes de um `@import` seria descartada, e aqui não há nenhuma.
- **Aderência ao architecture.md:** os dois pacotes estão registrados na tabela de §2 (`docs/architecture.md:67-68`), como o plano pedia. O token `--shadow-card` fica no `@theme` (`index.css:38`), o que gera `shadow-card` sem valor literal no JSX. O comentário do `@theme` foi atualizado.
- **Coerência CSS e documentação:** o valor `0 4px 12px rgba(22, 23, 43, 0.08)` é idêntico em `index.css:38`, `docs/design-tokens.md` (seção Sombra) e no teste.
- **Dependências:** só os dois pacotes `@fontsource` entraram em `apps/web/package.json`. O `package-lock.json` tem +20 linhas, compatíveis com isso.
- **Escopo:** os arquivos tocados são os previstos no plano.

## Sugestões (não bloqueiam)
- **Teste de importação fraco** (`apps/web/src/index.css.test.ts`, bloco `it.each`): `toContain("@import '<pacote>/")` não prova que o `@import` está ativo, porque casaria também dentro de um comentário. Também não verifica os pesos. Se alguém apagar `700.css`, o teste continua verde e o build perde o `titulo-card`. Uma opção é afirmar cada arquivo (`saira/400.css`, `600.css`, `700.css`, `saira-stencil-one/400.css`) com regex ancorada no início da linha, `^@import '...';`.
- **Frase desatualizada em `docs/design-tokens.md:116`:** "ambas do Google Fonts" continua escrito. Agora as fontes são self-hosted via `@fontsource`, então vale trocar por algo como "servidas por `@fontsource`".
- **Variantes não usadas:** as variantes `latin-ext` e `vietnamese` vão para o `dist` e só são baixadas se o navegador precisar delas (`unicode-range`). Não é problema. Se o tamanho do build importar, dá para importar só `latin-*.css`, mas não recomendo agora.

## Observações fora do escopo deste diff
- O teste `@theme\s*\{[\s\S]*?\n\}` (já existente) depende de o `}` do bloco estar em coluna 0. Um `}` indentado dentro do `@theme` quebraria a extração. Não é do diff, mas vale uma Issue de manutenção se o `@theme` crescer.
