# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

Execução: `npm run test:e2e -w apps/api` rodou uma vez, 12 arquivos e 129 testes, todos passaram. Os ERROR no log vêm de `base-global.e2e-spec.ts`, que é um probe intencional. `npm test -w apps/api` passou (1/1). `npm run lint -w apps/api` terminou sem avisos.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3 (edição): nome vazio, só espaços, maior que 60, não texto ou nulo; preço não numérico, nulo, ≤0, >9999,99, 3 casas. Resposta 400 indica o campo e nada é alterado | atendido | `dto/create-plan.dto.ts:18-38` (regras compartilhadas), `dto/update-plan.dto.ts:21-40`, teste `plans-update.e2e-spec.ts:149-186` (confere campo e plano intacto) |
| CA3: corpo vazio `{}` | atendido: 400 e `updatedAt` intacto | `plans.service.ts:35-44`, teste `plans-update.e2e-spec.ts:188-200` |
| CA4 (edição): nome de outro plano, sem diferenciar caixa ou espaços, dá 409 com `details` no campo `name`, sem vazar `P2002`, `prisma` ou `nameKey`, e nada é gravado | atendido | `plans.service.ts:78-85`, teste `plans-update.e2e-spec.ts:222-250` |
| CA4: manter o próprio nome com outra caixa é permitido | atendido | teste `plans-update.e2e-spec.ts:124-136` (a unicidade vem do índice do banco; o próprio registro não conflita) |
| CA6: nome e preço atualizados, `Subscription.priceCents` inalterado, `GET /plans/available` mostra o novo | atendido | `plans.repository.ts:12-22` (só toca `Plan`), teste `plans-update.e2e-spec.ts:252-277` com assinatura criada direto no banco |
| CA7: desativar tira o plano de `available` e a assinatura segue intacta | atendido | teste `plans-update.e2e-spec.ts:280-300` |
| CA8: ativar devolve o plano a `available` | atendido | teste `plans-update.e2e-spec.ts:302-314` |
| CA12 (editar, ativar, desativar): plano inexistente dá 404 | atendido | `plans.service.ts:86-88` (P2025), teste `plans-update.e2e-spec.ts:318-330` com 3 variações de corpo |
| CA13: cliente recebe 403 e o plano fica intacto | atendido | `plans.controller.ts:123` (`@Roles(Role.ADMIN)`), teste `plans-update.e2e-spec.ts:344-356` |
| CA14: sem sessão dá 401 e o plano fica intacto | atendido | teste `plans-update.e2e-spec.ts:358-370` |
| Verificações extras pedidas: nenhuma Subscription é escrita | atendido | o repositório faz só `prisma.plan.update`, e nenhuma rota cria assinatura |
| Verificações extras pedidas: nada vaza `nameKey` ou `priceCents` | atendido | `plans.service.ts:92-108` (`toDto`), teste `plans-update.e2e-spec.ts:138-146` |
| Verificações extras pedidas: `POST /plans` sem mudança de comportamento | atendido | o create usa `translateWriteError`, que devolve o mesmo 409 e o mesmo texto; sem checagem prévia, a corrida do CA5 segue no índice; `plans-create.e2e-spec.ts` passou |
| Verificações extras pedidas: nada fora da Tarefa 5 foi alterado | atendido | os arquivos tocados são `plans.controller.ts`, `plans.service.ts`, `plans.repository.ts`, `dto/update-plan.dto.ts`, `dto/plan-id-param.dto.ts`, a extração em `dto/create-plan.dto.ts` e `plans-update.e2e-spec.ts`; as demais diferenças são as Tarefas 1 a 4 já aprovadas |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- A rota é `PATCH /plans/:id` e aceita `active` junto com nome e preço, o que cobre CA7 e CA8 como o plano previa. O `PlanIdParamDto` devolve 400 para id que não é UUID, comportamento que a spec não pede, mas que é coerente. Não considero escopo inflado.
- Os testes de CA6 e CA7 conferem `priceCents` e `planId` da assinatura. Não conferem `updatedAt` nem a contagem de assinaturas. Isso é suficiente para o CA, mas tem asserção um pouco mais fraca do que poderia.
- O CA4 em edição está provado só no caso sequencial. A corrida entre duas edições depende do índice único em `nameKey`, o mesmo mecanismo do CA5, e a spec só exige corrida para criação.
- `plans.service.ts:35-44` rejeita corpo vazio dentro do service (400 com `details` no campo `body`). É uma escolha de organização, que fica para o revisor de código.
