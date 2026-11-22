# Parecer de Código — Tarefa 8

**Veredito:** APONTAMENTOS (REPROVADO por 1 item bloqueante, de correção pequena)

Verificação rodada: `npm test -w apps/web` passa (8 arquivos, 75 testes). `npm run lint` e `npx tsc -b` passam sem saída. O `npm test` rodado direto dentro de apps/web falha com "Vitest failed to find the current suite". É problema de ambiente por causa do caminho com acento e não do código. Pela raiz, com `-w`, passa.

## Apontamentos (bloqueiam)
1. **Falha engolida em silêncio quando `details` não tem campo conhecido.** `apps/web/src/features/plans/components/PlanForm.tsx:163-169`.
   - O ramo `details && details.length > 0` só copia os campos `name` e `price`. Se a API devolver `details` com outro campo, `next` fica `{}`. Nesse caso `setFieldErrors({})` roda e `generalError` não é preenchido, porque o `else` não é alcançado.
   - Regra violada: "tratamento de erro que engole a falha silenciosamente" (revisor-codigo.md), e a mensagem geral em `role="alert"`.
   - Prejuízo concreto: o usuário clica em "Criar plano" e nada acontece, sem erro visível. Isso ocorre, por exemplo, se o backend rejeitar um campo extra pela whitelist da validação, ou se o contrato mudar.
   - Correção sugerida: se nenhum erro de campo foi mapeado, cair na mensagem geral (`error.message`).

## Sugestões (não bloqueiam)
- **Duplicação com o FormField da auth.**
  - O `PlanField` (`PlanForm.tsx:85-137`) repete a ligação label/`aria-invalid`/`aria-describedby`, o texto de erro e o SVG do ícone de erro do `FormField` (`features/auth/components/FormField.tsx`).
  - Criar um componente interno foi a escolha certa dentro da regra de dependência. Importar da feature auth violaria o §4, e `FormField` só aceita `type: 'email' | 'password'`.
  - O §4 indica `shared/` como lugar natural. Abra uma Issue de manutenção para promover um campo genérico (`type` aberto, `inputMode`) a `shared/` e trocar nas duas features. Hoje o custo é de duas cópias do ícone e da marcação de erro.
- **Mensagem de rede duplicada.**
  - `PlanForm.tsx:75` define `NETWORK_MESSAGE`, mas `NetworkError` em `shared/http/client.ts` já traz mensagem em português.
  - Dois textos para a mesma falha podem divergir. Bastaria usar `error.message` para qualquer `Error`.
  - O teste de rede passa a exigir o texto de `shared/http` se isso mudar.
- **`parsePrice` aceita entradas que não são preço em reais.** `PlanForm.tsx:78-83`
  - `Number()` aceita `"0x10"` (vira 16) e `"1e3"` (vira 1000). Vale restringir com regex, como `^\d+([.,]\d{1,2})?$`.
  - `"1.234,56"` com separador de milhar vira NaN e dá "preço inválido". É aceitável, mas vale documentar.
  - `Math.round(v*100)/100` sofre erro de ponto flutuante: `1.005` vira `1`. Se a regex limitar a 2 casas, o arredondamento deixa de ser necessário.
- **Erro no refetch descarta a lista.** `usePlans.ts:45`
  - O `catch` faz `setState({ error, loading: false })` sem preservar `data`. Se o refetch pós-criação falhar, os planos já exibidos somem e só o alerta fica. O refetch mantém `data` ao carregar (linha 58), então o `catch` poderia fazer o mesmo.
- **Anti duplo clique sem teste.**
  - O botão fica `disabled` durante o envio (`PlanForm.tsx:208`), o que está correto. Nenhum teste comprova isso, nem o texto "Criando…".
  - Um teste com `fetch` pendente e dois cliques cobriria a regressão.
- **Erro de preço inválido só no cliente.** Não é lido pelo leitor de tela até o foco. Vale mover o foco para o primeiro campo inválido após o submit, ou usar `role="alert"` no `<p>` de erro, já que o foco não é gerenciado em nenhum erro.
- **Testes.**
  - A consulta `rows[1]` (índice da linha) acopla ao cabeçalho. É aceitável, e o comentário explica.
  - As consultas são por papel e rótulo, sem timeouts, e o isolamento com `afterEach(unstubAllGlobals)` está bom.
  - `fetchMock.mock.calls[1]` usa `init.method` sem tipo, mas o `tsc` passa.

## Conferido e conforme
- **Camadas:**
  - `pages/` e `components/` não chamam `fetch`.
  - Só `plansApi.ts` usa `shared/http`, sem import de `api/` de outra feature.
  - Os componentes de `components/` não conhecem rota.
  - `usePlans` vive em `features/plans/api` e expõe `data`/`loading`/`error`. Tem flag `obsolete` e `refetch`.
  - O estado de UI (`submitting`, erros, campos) fica no `PlanForm`.
- **Tratamento de erro:** `ApiError.details` vai por campo, `NetworkError` tem tratamento próprio, a mensagem geral está em `role="alert"`, e o formulário é limpo só após sucesso.
- **Estilo:** só classes de tokens. Verifiquei `max-w-formulario`, `text-legenda`, `bg-perigo-fundo`, `bg-sucesso-fundo` e `bg-superficie-media` no `@theme`, e não há valores literais.
- **Acessibilidade:** `label`/`htmlFor`, `aria-invalid` e `aria-describedby` só quando há erro. `caption` `sr-only`, `th scope="col"`, `noValidate` com validação própria e foco por `:focus-visible` global.
- **Tipagem:** sem `any` nem casts frouxos.

## Observações fora do escopo deste diff
- `apps/web/src/shared/http/client.ts:1`: falta espaço em `||'http://localhost:3000'`. É estilo, pré-existente.
- Candidata a Issue de manutenção: campo de formulário compartilhado em `shared/` (ver a sugestão de duplicação).
