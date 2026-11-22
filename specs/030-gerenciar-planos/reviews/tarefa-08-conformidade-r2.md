# Parecer de Conformidade — Tarefa 8 (rodada 2)

**Veredito:** APROVADO

Rodei `npm test` em apps/web: 8 arquivos e 76 testes passaram. `npm run lint` (oxlint) e `npx tsc -b` saíram sem erros.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| (a) Mudança limitada ao tratamento do ApiError | atendido | `PlanForm.tsx:99-113`, teste novo em `PlansAdminPage.test.tsx:235-259` |
| (b) `details` desconhecido: mensagem geral em role="alert", formulário preenchido, botão habilitado | atendido | `PlanForm.tsx:105-112` (só usa erros de campo se `Object.keys(next).length > 0`). O teste asserta o alert com "Dados inválidos no envio", os dois campos sem `aria-invalid`, os valores "Premium" e "19,90" mantidos e o botão habilitado. |
| CA1 lista com nome, preço e estado; estado vazio | atendido | testes de `PlansAdminPage.test.tsx:58` e `:80`; esta rodada não tocou nesse comportamento |
| CA2 criar válido faz o plano aparecer ativo | atendido | teste em `PlansAdminPage.test.tsx:114` |
| CA3 400 com details de name/price junto ao campo | atendido | `PlanForm.tsx:103` mapeia name/price; testes em `:162` e `:178` verificam `aria-invalid` e a descrição acessível |
| CA4 409 junto ao campo nome | atendido | teste em `PlansAdminPage.test.tsx:211` |
| CA3 e CA4 sem details | atendido | Cai no ramo `else` de `PlanForm.tsx:110` e mostra `error.message` no alert. Ver observação 1. |
| CA18 falha de rede em português, formulário preenchido, nova tentativa | atendido | `PlanForm.tsx:107-108`; teste em `PlansAdminPage.test.tsx:261` cobre alerta, valores mantidos, botão habilitado e reenvio com sucesso |
| CA20 rótulo em todo campo, erro ligado por `aria-describedby`, operação só por teclado | atendido | `PlanForm.tsx:38-52`; testes em `:105` e `:141` |
| (d) Nada fora do escopo | atendido | `git status --short apps/web` mostra o mesmo conjunto de arquivos da rodada 1 (routes, authApi, HomePage, RequireAdmin e `features/plans/`). Não vi arquivo novo nem alteração fora do ponto aceito. |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
1. Não há teste dedicado para 400 ou 409 sem `details`. O caminho é o mesmo `else` já exercido pelo teste de `details` desconhecido e pelo de rede, então o comportamento está coberto de forma indireta.
2. Não consegui comparar o `PlanForm.tsx` da rodada 1 com o atual, porque o arquivo não é rastreado. Confirmei (a) e (d) pela leitura do código, pelo teste e pela lista de arquivos alterados.
3. Continuam registradas, sem mudança, as observações da rodada 1 sobre `parsePrice`: arredondamento silencioso de 19,999 para 20,00 e aceitação de notação científica ou hexadecimal.

Arquivos principais:
- c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanForm.tsx
- c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.test.tsx
