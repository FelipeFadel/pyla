# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

Execução: `npm run test:e2e -w apps/api` rodou uma vez, sozinho: 13 arquivos e 138 testes passaram. `npm test -w apps/api` passou (1 teste). `npm run lint -w apps/api` rodou sem saída de erro. Os ERROR no log do e2e vêm de `base-global.e2e-spec.ts` e são esperados (rota de sonda que lança de propósito).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA10 (API): plano sem assinantes é removido, some da lista e de `available` | atendido | `plans.controller.ts` (`@Delete(':id')`, `@HttpCode(204)`); `plans.service.ts:55-62`; `plans.repository.ts:24-26`; teste `plans-delete.e2e-spec.ts:76-105` (inclui plano inativo e confere o banco) |
| CA11: plano com assinantes dá 409, permanece, mensagem sugere desativar | atendido | `plans.service.ts:56-58`, `:100-102`; teste `plans-delete.e2e-spec.ts:109-136` (409, `desativ`, sem vazamento de P2003/prisma, plano e Subscription intactos) |
| CA11 (corrida): FK Restrict traduzida para o mesmo 409 | atendido | ramo P2003 em `plans.service.ts:93-95`; FK `ON DELETE RESTRICT` na migration (linha 35) e `schema.prisma:45`; teste `plans-delete.e2e-spec.ts:138-155` |
| CA12 (excluir): inexistente dá 404 | atendido | P2025 em `plans.service.ts:90-92`; testes `:159-177` (uuid inexistente e segunda exclusão); id não-uuid dá 400 (`:179-188`) |
| CA13: não administrador dá 403, plano intacto | atendido | `@Roles(Role.ADMIN)`; teste `plans-delete.e2e-spec.ts:191-199` |
| CA14: sem sessão dá 401 | atendido | teste `plans-delete.e2e-spec.ts:201-208` |

## Apontamentos
Nenhum.

## Observações (não bloqueantes)
- **Teste da corrida exercita a FK.** O teste cria a Subscription de verdade no banco, depois força `countSubscriptions` a devolver 0 com `vi.spyOn`. Só o `delete` real contra o Postgres pode recusar, e ele recusa pela FK Restrict. Confirmei isso na migration e no schema. O mock fica só na checagem prévia, não no banco. O teste assevera que plano e Subscription seguem com contagem 1. O `afterEach` restaura o mock.
- **Plano com assinante permanece junto com a Subscription.** Atendido nos dois testes de 409. Eles conferem `planId` e `priceCents` da assinatura (`:130-134`, `:153-154`).
- **Nenhuma escrita em Subscription no código de produção.** O único uso de `subscription` em `src/` é `subscription.count` (`plans.repository.ts:29`). As escritas ficam só nos testes, como a spec prevê.
- **Fora do escopo.** Não encontrei alteração fora da Tarefa 6 nos arquivos da tarefa. `PlansController`, `PlansService` e `PlansRepository` ganharam apenas `remove`/`delete`/`countSubscriptions`, o ramo P2003 e `hasSubscribersError`. Os demais arquivos modificados (schema, auth, users, plan.md e outros) pertencem às Tarefas 1 a 5 e não foram revistos. O `translateWriteError` agora também trata P2003 para update/create. Isso é inofensivo, porque nenhum deles escreve `planId`.
- **204 com interceptor global.** Com 204 o corpo é descartado e o teste confere `res.text === ''`, então o contrato fica coerente. A spec não fixa o status de sucesso, e a escolha do implementador é compatível com CA10.
- **404 de id inexistente vem do P2025 do `delete`.** O `count` devolve 0 para id inexistente e segue para o `delete`. Não é bug.
- **Aviso de CRLF do git** em `auth.module.ts` (Tarefa anterior). Não é da Tarefa 6.

Arquivos principais:
- c:\Users\Usuário\pyla\apps\api\src\plans\plans.controller.ts
- c:\Users\Usuário\pyla\apps\api\src\plans\plans.service.ts
- c:\Users\Usuário\pyla\apps\api\src\plans\plans.repository.ts
- c:\Users\Usuário\pyla\apps\api\test\plans-delete.e2e-spec.ts
