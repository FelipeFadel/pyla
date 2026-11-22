# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

Testes: `npm test -w apps/web` passou, 8 arquivos e 75 testes. O `lint` (oxlint) rodou sem apontamentos. O `npx tsc -b` saiu com código 0. Não rodei os e2e da API, conforme pedido.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 (front): lista com nome, preço e estado | atendido | `PlanList.tsx:14-47`; teste `PlansAdminPage.test.tsx:58-78` |
| CA1: "Ativo"/"Inativo" em texto | atendido | `PlanList.tsx:40` |
| CA1: preço em R$ pt-BR | atendido | `PlanList.tsx:3-8` (Intl BRL com NBSP trocado por espaço comum); teste `:73,:76` |
| CA1: ordem alfabética | atendido na tela, que mostra a ordem recebida. A ordenação é do backend (fora desta tarefa). | `PlansAdminPage.tsx:41` |
| CA1: estado vazio que convida a criar | atendido | `PlansAdminPage.tsx:36-39`; teste `:80-88` |
| CA2 (front): cria e aparece ativo | atendido | `PlansAdminPage.tsx:9-12` (POST e `refetch`); teste `:114-139` |
| CA2: corpo do POST `{ name, price }` com preço numérico em reais | atendido | `PlanForm.tsx:96` e `plansApi.ts:21-23`; teste `:136` verifica `{ name: 'Premium', price: 19.9 }` e `:159` verifica `price: 5` |
| CA3 (criação): 400 junto ao campo com `aria-invalid` e `aria-describedby`, em português | atendido | `PlanForm.tsx:49-50,53-71,100-106`; testes `:162-193` verificam `aria-invalid` e `toHaveAccessibleDescription` |
| CA3: preço que não é número | atendido | `PlanForm.tsx:88-92` mostra o erro no campo sem chamar a API; teste `:195-209` |
| CA4 (criação): 409 junto ao campo nome | atendido | usa o mesmo caminho de `details`; teste `:211-233` |
| CA18: falha de rede em português, formulário mantido, reenvio | atendido | `PlanForm.tsx:107-108,121-125`; `setName`/`setPrice` só rodam em caso de sucesso (`:97-98`); o botão volta a ficar habilitado (`:115`); teste `:235-261` cobre o reenvio com sucesso e o alerta sumindo |
| CA18: sem tela em branco | atendido | a lista continua visível; erro de carga tem "Tentar de novo" (`PlansAdminPage.tsx:23-34`; teste `:90-103`) |
| CA20: todo campo com rótulo associado | atendido | `PlanForm.tsx:38-45` (`label htmlFor`); teste `:105-112` |
| CA20: erro ligado ao campo, não só por cor | atendido | `PlanForm.tsx:49-50,53-70` (ícone SVG decorativo e texto) |
| CA20: só pelo teclado | atendido | `PlanForm.tsx:120` (`form` com botão `submit`); teste `:141-160` (Tab, digitar, Enter) |
| Rota `/admin/planos` protegida | atendido | `routes.tsx` e `routes.test.tsx` (apoio, da Tarefa 7) |
| Nada fora do escopo | atendido | não há edição, ativar/desativar, exclusão nem tratamento de 401 na tela. O 401 continua sendo tratado só pelo cliente HTTP compartilhado, que já existia. |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- **Arredondamento do preço.** `PlanForm.tsx:19` aplica `Math.round(value*100)/100` antes de enviar. Um valor como "0,004" vira 0 e o servidor devolve 400, o que está correto. Um valor como "19,999" vira 20,00 em silêncio, sem a API ter chance de recusar. A spec não define casas decimais, então não reprova. Vale decidir se o front deve recusar mais de 2 casas.
- **Formatos de preço aceitos.** `parsePrice` aceita notação científica como "1e3" (vira 1000) e hexadecimal como "0x10" (vira 16), porque usa `Number()`. Um preço digitado com separador de milhar ("1.234,56") é recusado com a mensagem do campo. Isso cumpre CA3, mas é um comportamento que a spec não pediu. Pertence ao revisor de código ou à triagem.
- **Nome sem validação no cliente.** O nome vazio, só espaços ou com mais de 60 caracteres só é recusado pelo servidor. Isso atende CA3, que fala em 400 da API, e o teste cobre o erro do nome vindo do servidor (`:162-176`). Não há teste de que o nome com espaços nas pontas seja enviado como digitado, mas o backend faz o trim.
- **Rótulo de campo que não é `PlanForm`.** O campo "Preço (R$)" usa `type="text"` com `inputMode="decimal"`. Isso é coerente com a vírgula pt-BR.
- **Mensagem de erro do servidor sem detalhes.** Um 400 ou 409 sem `details` cai no `generalError`, mostrando a mensagem da API em um `role="alert"` sem ligação ao campo. Em condições normais a API sempre envia `details` (verificado só nos mocks).

Arquivos revisados:
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\api\plansApi.ts`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\api\usePlans.ts`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanForm.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\components\PlanList.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.tsx`
- `c:\Users\Usuário\pyla\apps\web\src\features\plans\pages\PlansAdminPage.test.tsx`
