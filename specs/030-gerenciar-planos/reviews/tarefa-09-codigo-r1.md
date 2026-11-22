# Parecer de Código — Tarefa 9

**Veredito:** REPROVADO (2 apontamentos bloqueantes)

Rodei `npm test -w apps/web` (95 testes passam), `npm run lint -w apps/web` e `npx tsc -b` em `apps/web`. Os três passam, sem erros. Segundo o §4, o estilo está só com classes de token, sem valor literal. Não há `fetch` em `pages/` nem em `components/`, nenhuma feature importa o `api/` de outra, e o `PlanForm` fica fora de `<table>`.

## Apontamentos (bloqueiam)

1. **O anti duplo clique falha ao ativar ou desativar planos diferentes em sequência, porque a pendência é um único `pendingId`.** — `apps/web/src/features/plans/pages/PlansAdminPage.tsx:12`, `:57` e `:67`
   - Regra violada: §4, o estado de UI no componente tem de refletir a realidade. A Tarefa 9 exige anti duplo clique e concorrência segura.
   - Prejuízo concreto: o usuário clica em "Desativar" no plano A e, com A ainda em voo, clica em B. Isso sobrescreve `pendingId` e o botão de A volta a ficar habilitado durante a chamada. Quando A termina, o `finally` zera `pendingId`, e o botão de B habilita com a chamada de B em voo. Um terceiro clique dispara PATCH duplicado.
   - O `setPendingId(undefined)` incondicional também apaga a pendência de outro plano.
   - O teste "desabilita o botão durante a chamada" cobre só um plano. Não há teste de dois planos em voo.

2. **O foco se perde quando a edição fecha e quando o botão de ativar/desativar é desabilitado.** — `PlansAdminPage.tsx:51`, `:123` e `:29`; `PlanList.tsx:64`; `PlanForm.tsx:89-91`
   - Regra violada: §4, acessibilidade (NFR) e CA20, "operável só pelo teclado". O foco entra no primeiro campo ao abrir a edição, mas nada o devolve na saída.
   - Prejuízo concreto: depois de Salvar, Cancelar, Salvar sem mudanças ou 404, o formulário desmonta e o foco cai no `body`. Quem usa teclado ou leitor de tela precisa tabular desde o topo da página para voltar ao botão "Editar plano X".
   - Ao ativar ou desativar, o botão focado fica `disabled` (`PlanList.tsx:64`). O navegador o tira da ordem de tabulação, e o foco só se perde ali também.
   - Nenhum teste cobre o retorno de foco. O teste de teclado só verifica a entrada na edição.

## Sugestões (não bloqueiam)

- **Edição aberta de outro plano é descartada por um 404 alheio.** `handlePlanGone` (`PlansAdminPage.tsx:27-31`) faz `setEditingId(undefined)` sempre. Um 404 ao alternar o plano A descarta o que o usuário digitou no plano B. Fechar a edição só quando `editingId === plan.id` evita a perda.
- **O mapeamento de erro está duplicado e o texto de fallback está repetido.** O `Error` → mensagem geral aparece em `PlansAdminPage.tsx:63-65` e em `PlanForm.tsx:119-124`. O literal `'Algo deu errado. Tente novamente.'` aparece em três arquivos (também em `usePlans.ts:23`). `NETWORK_MESSAGE` já foi movida para `planMessages.ts`, então `GENERIC_ERROR_MESSAGE` caberia lá.
- **Fica a ambiguidade de `onCancel` opcional.** O `PlanForm` mistura `plan` e `onCancel` opcionais, com `editing` ramificando cinco vezes e `plan ?` em `:136` convivendo com `editing`. O botão "Cancelar" renderiza e não faz nada se o pai esquecer `onCancel`. Uma união discriminada de props (`{plan, onCancel}` ou nenhum) tornaria o contrato explícito. Use `editing` de forma consistente.
- **A edição só aparece no fim da página.** O formulário "Editar plano" fica abaixo da lista, longe da linha clicada. Em lista longa, a edição pode abrir fora da viewport, embora o foco vá para ela.
- **A ação "Salvar" não anuncia o sucesso.** Ativar, desativar e editar não anunciam o resultado a leitores de tela. Só os erros têm `role="alert"`. Uma região `role="status"` resolveria.
- **Há um `td` com `flex`.** `PlanList.tsx:52` aplica `className="flex gap-xs py-xs"` direto no `td`, o que tira a célula do layout de tabela. É melhor colocar o `flex` num `div` interno.
- **O `aria-label` do `form` repete o dos botões.** O `form` de edição usa `aria-label="Editar plano X"`, igual ao do botão "Editar plano X". Os testes distinguem por papel, mas a duplicidade confunde leitor de tela. Algo como "Edição do plano X" seria mais claro.
- **`handleEdit` compara com `trim` mas envia o nome sem `trim`.** `PlansAdminPage.tsx:36` compara `values.name.trim()` com `plan.name` e envia `values.name`. Funciona se a API normaliza o nome. Vale enviar o valor aparado ou comentar a dependência.
- **Faltam testes para a concorrência.** Faltam dois casos: toggle de dois planos em voo (apontamento 1) e toggle com edição aberta.

## Observações fora do escopo deste diff

- O 401 e o botão Excluir ficam para a Tarefa 10, como combinado.
- As sugestões já registradas na Tarefa 8 (campo duplicado com a feature auth, `parsePrice` aceitando `0x10`/`1e3`, catch do `usePlans` descartando a lista no refetch) não foram repetidas.
