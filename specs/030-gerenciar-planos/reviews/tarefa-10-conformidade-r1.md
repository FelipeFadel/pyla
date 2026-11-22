# Parecer de Conformidade — Tarefa 10

**Veredito:** APROVADO

Rodei `npm test -w apps/web` (8 arquivos, 116 testes, todos passam), `npm run lint -w apps/web` (sem avisos) e `npx tsc -b` em apps/web (sem erros). Não rodei os e2e da API.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 (front): confirmação antes de excluir | atendido | `PlansAdminPage.tsx:203-207` só abre `confirmingId`; `DeleteConfirmation.tsx`. O teste em `PlansAdminPage.test.tsx:805` confere `alertdialog` com o nome do plano e `fetchMock` chamado 1 vez (só a listagem). |
| CA10 (front): cancelar não altera nada | atendido | `cancelDelete` em `PlansAdminPage.tsx:119`. O teste em `:820` confere que não há DELETE (1 chamada), que o plano continua na lista e que o foco volta ao Excluir. |
| CA10 (front): confirmar remove o plano da lista | atendido | `handleConfirmDelete` em `:125-134` chama `deletePlan` e depois `refetch()`. O teste em `:834` confere o DELETE em `/plans/p1`, um GET de refetch (3 chamadas) e o estado vazio. |
| CA11 (front): 409 mostra mensagem com "desativ" e o plano permanece | atendido | `:135-150` usa `failure.message` (vinda da API) e não refaz a listagem. O texto em `apps/api/src/plans/plans.service.ts:14` contém "desative-o". O teste em `:854` confere `/desativ/`, o foco no alerta, o plano na tela e o diálogo fechado. |
| CA12 (excluir): 404 com mensagem em português e lista atualizada | atendido | `:136-138` chama `handlePlanGone` (mensagem `PLAN_NOT_FOUND_MESSAGE` e `refetch`). O teste em `:869` confere a mensagem, o estado vazio e o GET como 3ª chamada. |
| CA19: 401 ao excluir leva ao login, sem erro técnico | atendido | `:141` (`isSessionExpired` retorna sem aviso). O teste em `:957` confere `assign('/login')` e a ausência de `alert` e do texto "Sessão inválida". |
| CA19: 401 nas outras ações (ativar/desativar, criar, editar, listar) | atendido | `:101` (ativar/desativar), `PlanForm.tsx:113` (criar/editar) e `PlansAdminPage.tsx:175` (listagem). Há teste para cada uma, em `:970-1014`. |
| Sem regressão em criar, editar, ativar e desativar | atendido | Os testes das Tarefas 1 a 9 continuam passando. |
| Sem escopo inflado | atendido | Ver observações. |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- **Redirecionamento do CA19.** Confirmei no código que `shared/http/client.ts:63-65` chama `window.location.assign('/login')` em todo 401, exceto em `/auth/login`, `/auth/register` e `/auth/me`. Todas as rotas de `/plans` passam por esse caminho, então o redirecionamento global mais a ausência de alerta cumprem "leva ao login, sem mostrar erro técnico". Os testes provam as duas metades: o `assign` é chamado com `/login` e não aparece `alert` nem o texto da API. O redirecionamento em si é uma navegação com recarga da página, não uma rota do roteador, mas atende à spec.
- **Stub de `location`.** Os testes de 401 substituem `location` por `{ assign }`, o mesmo padrão de `client.test.ts`. Isso prova o contrato da tela com o cliente HTTP, que a spec pede. Não prova a navegação real, o que é aceitável aqui.
- **`client.test.ts`.** O único acréscimo é o teste de 204 sem corpo, necessário para o DELETE devolver `undefined`. O `client.ts` não mudou, como informado.
- **Foco.** `h1` com `tabIndex=-1` e a lógica de alvos de foco servem ao CA20 (teclado) e não a funcionalidade nova. Não vejo isso como escopo inflado.
- **Falha de rede ao excluir.** Há tratamento e teste (`:884`), mensagem em português e plano mantido. A spec não pede isso explicitamente, mas cobre o caso de abandono "rede caindo" sem custo de escopo.

Arquivos revisados, todos em `c:\Users\Usuário\pyla\apps\web\src`:
- `features/plans/pages/PlansAdminPage.tsx`
- `features/plans/pages/PlansAdminPage.test.tsx`
- `features/plans/api/plansApi.ts`
- `features/plans/api/usePlans.ts`
- `features/plans/components/DeleteConfirmation.tsx`
- `features/plans/components/PlanList.tsx`
- `features/plans/components/PlanForm.tsx`
- `features/plans/components/planMessages.ts`
- `shared/http/client.ts`
- `shared/http/client.test.ts`
