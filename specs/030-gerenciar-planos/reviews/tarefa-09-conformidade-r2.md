# Parecer de Conformidade — Tarefa 9 (rodada 2)

**Veredito:** APROVADO

Verificação executada:
- `npm test -w apps/web`: 8 arquivos e 101 testes passando.
- `npm run lint -w apps/web`: oxlint sem saída, ou seja, sem avisos.
- `npx tsc -b` em apps/web: saiu com código 0, sem erros.
- Não rodei os e2e da API, conforme pedido.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 (400 na edição, erro junto ao campo; nome/preço inválido) | atendido | `PlansAdminPage.test.tsx:393`, `:409`, `:425` |
| CA4 (409 na edição aponta o campo nome) | atendido | `PlansAdminPage.test.tsx:440` |
| CA6 (front: editar nome e preço atualiza a linha, PATCH só do campo alterado) | atendido | `PlansAdminPage.tsx` (handleEdit), testes em `:315` e `:348` |
| CA7 (desativar: estado em texto "Inativo", botão passa a "Ativar") | atendido | `PlanList.tsx` (coluna Estado e botão), `PlansAdminPage.test.tsx:509` |
| CA8 (ativar: estado "Ativo", botão passa a "Desativar") | atendido | `PlansAdminPage.test.tsx:529` |
| CA12 (404 ao editar, ativar ou desativar: mensagem em português e refetch) | atendido | `PlansAdminPage.tsx` (handlePlanGone), testes em `:493`, `:569`, `:582` |
| CA20 (rótulo e nome acessível único por plano; fluxo só por teclado; foco) | atendido | `PlanList.tsx` (aria-label por plano), `PlansAdminPage.test.tsx:300`, `:608`, `:629`, `:694-780` |
| Criação da Tarefa 8 (sem regressão) | atendido | testes de `:105` a `:261` continuam verdes |
| CA18 na edição (rede falha, mantém valores) | atendido | `PlansAdminPage.test.tsx:465` |

## Verificações específicas da rodada 2
- **(a) Escopo e decisão.**
  - Os apontamentos aceitos estão cumpridos.
  - `pendingIds` é um `Set` imutável por plano, e `handleToggleActive` retorna cedo se o plano já está pendente.
  - O foco volta ao botão "Editar plano <nome>" via `editButtons` (Map registrado por ref no `PlanList`) e `useEffect` com `focusTarget`.
  - Isso vale para Salvar, Cancelar e Salvar sem mudanças.
  - No 404 o foco vai ao aviso `role="alert"` com `tabIndex={-1}`.
  - Os arquivos tocados são os três informados (PlansAdminPage.tsx, PlanList.tsx, PlansAdminPage.test.tsx). Não há mudança fora do escopo.
- **(c) aria-disabled.**
  - O botão ativar/desativar usa `aria-disabled={pendingIds.has(plan.id)}`, então continua anunciado como desabilitado e mantém o foco.
  - O teste em `PlansAdminPage.test.tsx:545-566` clica duas vezes e confirma `aria-disabled="true"` e apenas 2 chamadas de fetch (lista e um PATCH).
  - O teste em `:648-690` confirma que dois planos pendentes ao mesmo tempo bloqueiam cada um só enquanto o seu próprio PATCH está em voo.
  - O teste em `:754` confirma que o foco permanece no botão durante e depois da chamada.
- **(d) Nada fora do escopo.** O diff de `apps/web` contém as rotas, o `RequireAdmin`, o `HomePage` e o `authApi`, que são de tarefas anteriores e não foram revisados de novo.

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
1. A guarda anti duplo clique lê `pendingIds` do closure do render. Entre dois cliques separados por um render ela funciona, como o teste prova. Dois eventos disparados antes do re-render usariam o estado antigo. Em eventos de clique reais o React processa cada clique antes do seguinte, então o risco é teórico. Fica para o revisor de código, se quiser tratar.
2. O nome do teste em `:545` ("desabilita o botão...") ficou desatualizado, porque agora é `aria-disabled`. É só nomenclatura.
3. `PlansAdminPage.tsx` abre o aviso de 404 e fecha a edição mesmo quando o 404 vem de um toggle de outro plano que não é o que está em edição. Isso não viola a spec.

Arquivos: `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.tsx`, `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanList.tsx`, `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.test.tsx`.
