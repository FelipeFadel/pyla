# Parecer de Código — Tarefa 10

**Veredito:** APROVADO

Rodei os três comandos, e todos passam. `npm test -w apps/web` deu 116 de 116 testes, `npm run lint -w apps/web` não apontou nada e `npx tsc -b` não deu erro.

## Apontamentos (bloqueiam)
Nenhum.

## Respostas às perguntas do despacho

- **`isSessionExpired` em `plans/api`, consumido por `components/` e `pages/`.** Não viola o §4, que veda `fetch` e o `api/` de *outra* feature. `PlanForm`, `PlanList` e a página já importam tipos e funções de `plans/api` da própria feature. A função não faz I/O, só um `instanceof ApiError` com `status === 401`. Quem faz o redirect continua sendo `shared/http/client.ts`, que não foi alterado.
- **Diálogo.** O `alertdialog` está correto no que depende da implementação:
  - tem `aria-labelledby` e `aria-describedby`, ambos resolvidos pelo teste com `toHaveAccessibleDescription`;
  - o foco inicial vai para Cancelar, o botão seguro;
  - cancelar devolve o foco ao botão Excluir da linha;
  - o fluxo só por teclado está coberto.

  Falta focus trap e Escape, e o fundo continua acessível. Isso não é bloqueante, porque o bloco é inline, não usa `aria-modal` e a confirmação é reversível por Cancelar. O risco é um leitor de tela tratar como modal algo que não prende o foco. Ver sugestão 1.
- **401 sem alerta.** Há um predicado único (`isSessionExpired`) e três pontos de consumo, que são três fronteiras de erro distintas: a listagem, o `PlanForm` e as ações da página. Cada ponto decide só "não mostrar nada". Isso cumpre o "num lugar só" do plano e do §4, porque a decisão de redirecionar está no cliente HTTP. Não há espalhamento a apontar.
- **Anti duplo clique.**
  - `pendingIds` é compartilhado com o alternar ativo/inativo.
  - Confirmar e Excluir são protegidos pelo guard em `handleConfirmDelete` e no `onDelete`. Cancelar em voo é ignorado em `cancelDelete`.
  - O teste de confirmar duas vezes usa uma promise controlada e verifica 2 chamadas de `fetch`, não 3.
- **Foco.** O alvo `delete:<id>` é consumido do mapa `deleteButtons`, e `heading` usa o h1 com `tabIndex={-1}`. O alvo é limpo antes de usar, então não vaza para o render seguinte. Os testes cobrem foco no h1 após o sucesso, no alerta após o 409 e no Excluir após Cancelar.
- **Estilo.** Só aparecem classes dos tokens (`perigo`, `perigo-fundo`, `desabilitado`, `texto-suave`, `gap-xs` e similares). Não encontrei valor literal.
- **Tipagem.** Sem `any` e sem cast. `focusTarget` é `string | undefined`.
- **Testes.**
  - O stub de `location` é restaurado pelo `afterEach(vi.unstubAllGlobals)`, e o `assign` é resetado no `beforeEach`.
  - As consultas são por papel e por rótulo.
  - O teste novo de 204 em `client.test.ts` é adequado.
  - Os cenários 409, 404, rede e 401 (excluir, alternar, criar, editar, listar) estão cobertos.

## Sugestões (não bloqueiam)

1. `DeleteConfirmation.tsx:19`: considerar Escape chamando `onCancel`, que é o comportamento esperado de `alertdialog`. Se não for implementado, avaliar trocar para `role="group"` ou `region` com título. Hoje o papel promete uma interação que o componente não entrega.
2. `PlansAdminPage.tsx:125-154`: corrida entre exclusões.
   - O que acontece: com a exclusão de A em voo, o usuário clica em Excluir no plano B, o que é permitido porque B não está pendente. Quando A termina, `setConfirmingId(undefined)` incondicional (linhas 133, 140 e `handlePlanGone`) fecha a confirmação de B e leva o foco ao h1. A direção é segura, pois nada é excluído, mas é um comportamento estranho.
   - Correção sugerida: `setConfirmingId((atual) => (atual === plan.id ? undefined : atual))`.
3. `PlansAdminPage.tsx:143-149` e `:103-104`: o mapeamento "rede, mensagem da API ou fallback" aparece no alternar ativo/inativo e no excluir (e de novo no `PlanForm`). A duplicação da mensagem de fallback já é conhecida. Sugiro uma função `messageFor(failure)` em `planMessages.ts`, que também elimina o ternário aninhado.
4. `PlansAdminPage.tsx:158`: o `<h1>` ficou numa linha só, bem acima da largura das demais. O projeto não tem formatador no lint, mas convém quebrar os atributos como no restante do arquivo.
5. `PlansAdminPage.tsx:50`: `isNotFound` é recriada a cada render dentro do componente, enquanto `isSessionExpired` vive em `plansApi`. Para simetria, mover para `plansApi.ts`.
6. Testes:
   - Falta cobrir "Cancelar ignorado com a exclusão em voo", que o código implementa em `cancelDelete`. O botão Cancelar também não sinaliza que está inerte enquanto `pending`, ao contrário de Confirmar.
   - O teste do 409 monta um terceiro `fetch` (`list(plan())`) que o código nunca consome, porque não há refetch nesse caminho. Isso não falha, mas induz a erro quem lê. Confirmar também que a ausência de refetch no 409 é intencional.
7. `DeleteConfirmation.tsx:20-24`: os ids fixos `excluir-plano-titulo` e `excluir-plano-descricao` só funcionam porque há no máximo um diálogo. `useId` removeria essa premissa implícita.

## Observações fora do escopo deste diff

- No 401 da listagem a página fica com `data` indefinido e sem carregando, ou seja, em branco até o redirecionamento acontecer. O comportamento é correto, só vale registrar se o redirect puder falhar.

Arquivos principais revisados, todos em `c:\Users\Usuário\pyla\apps\web\src\features\plans\`:
- `api\plansApi.ts`
- `components\DeleteConfirmation.tsx`
- `components\PlanList.tsx`
- `components\PlanForm.tsx`
- `pages\PlansAdminPage.tsx`
- `pages\PlansAdminPage.test.tsx`

Também revisei `c:\Users\Usuário\pyla\apps\web\src\shared\http\client.test.ts`.
