# Parecer de Conformidade — Tarefa 9

**Veredito:** APROVADO

Rodei `npm test -w apps/web` (8 arquivos, 95 testes, todos passando), `npm run lint -w apps/web` (sem avisos) e `npx tsc -b` dentro de apps/web (saída vazia, código 0). Não rodei os e2e da API.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 (edição): 400 do nome e do preço junto ao campo (`aria-invalid` e `aria-describedby`), valores mantidos, plano não muda | atendido | `PlanForm.tsx:93-129` e `PlanField` `:35-77`; testes `PlansAdminPage.test.tsx:393-438` |
| CA3 (edição): preço que não é número é barrado no cliente, junto ao campo, sem chamar a API | atendido | `PlanForm.tsx:98-102`; teste `:425-438` |
| CA4 (edição): 409 de nome repetido junto ao campo nome | atendido | `PlanForm.tsx:112-118`; teste `:440-463` |
| CA6 (front): editar nome e preço atualiza a linha | atendido | `PlansAdminPage.tsx:33-53` (PATCH e `refetch`); teste `:315-346` |
| CA6 (front): o PATCH leva só o campo que mudou | atendido | `PlansAdminPage.tsx:35-37`; testes `:345` (`{name, price}`) e `:364` (`{price}`) |
| CA6 (front): salvar sem mudanças não chama a API e fecha a edição | atendido | `PlansAdminPage.tsx:38-41`; teste `:381-391` |
| CA6 (front): Cancelar não chama a API nem altera a linha | atendido | `PlansAdminPage.tsx:123`; teste `:367-379` |
| CA7 (front): desativar troca o texto para "Inativo", o botão passa a "Ativar" e o PATCH leva `{active:false}` | atendido | `PlanList.tsx:49,63-68`, `PlansAdminPage.tsx:55-69`; teste `:509-527` |
| CA8 (front): ativar troca o texto para "Ativo", o botão passa a "Desativar" e o PATCH leva `{active:true}` | atendido | teste `:529-543` |
| CA7 e CA8: botão desabilitado durante a chamada (duplo clique) | atendido | `PlanList.tsx:64`; teste `:545-567` |
| CA12 (editar, ativar, desativar): 404 mostra mensagem em português, refaz a listagem (GET confirmado) e fecha a edição | atendido | `PlansAdminPage.tsx:22-31,45-48,62`, `planMessages.ts:2`; testes `:493-507`, `:569-592` |
| CA20: botões com nome acessível único por plano ("Editar plano X", "Ativar plano X", "Desativar plano X") | atendido | `PlanList.tsx:55,63`; teste `:300-313` |
| CA20: campos de edição com rótulo e ids distintos dos da criação (`plan-edit-*`) | atendido | `PlanForm.tsx:81,145,153` |
| CA20: fluxo só por teclado (Tab até Editar, Enter, foco no Nome, digitar, Enter salva; Tab e Enter desativam) | atendido | `PlanForm.tsx:89-91`; testes `:608-646` |
| CA18 (rede na edição e na troca de estado, já coberta pelos testes) | atendido | `PlanForm.tsx:119-121`, `PlansAdminPage.tsx:63`; testes `:465-491`, `:594-606` |
| Tarefa 8 (criação) sem regressão | atendido | `PlanForm.tsx:107-110` (limpa só fora da edição); testes `:114-287` passam |

## Apontamentos
Nenhum bloqueante.

## Observações (não bloqueiam)
1. Depois de Salvar, Cancelar ou do 404 na edição, o formulário de edição é desmontado e o foco cai no `body`. A spec exige só operação por teclado, e isso é atendido. Devolver o foco ao botão "Editar plano X" seria uma melhoria de usabilidade.
2. `notice` (a mensagem de 404 ou de rede) só é limpo ao editar ou alternar estado. Criar um plano em seguida não o limpa (`handleCreate`, `PlansAdminPage.tsx:17-20`). É um resquício visual, sem violar critério.
3. No tratamento do 404 na edição, `PlanForm` continua a executar `setSubmitting(false)` depois de `handlePlanGone` desmontá-lo. É inofensivo no React 18 ou superior e não gera aviso nos testes.
4. O 401 e o botão Excluir não existem na tela. Isso é da Tarefa 10 e não foi apontado.

Arquivos revisados:
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\api\plansApi.ts`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanForm.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanList.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\planMessages.ts`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.test.tsx`
