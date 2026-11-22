# Parecer de Conformidade — Tarefa 5, rodada 2

**Veredito:** APROVADO

Testes rodados: `npm run test:e2e -w apps/api` deu 12 arquivos e 129 testes passando. `npm test -w apps/api` deu 1 de 1 passando. `npm run lint -w apps/api` terminou sem erros. Os logs de ERROR no e2e vêm do probe intencional de `base-global.e2e-spec.ts`.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| (a) Mudança limitada à decisão da r1: pipe novo, uso no `@Body` do PATCH, bloco manual removido do service, guard de null em `translateWriteError` (já previsto na triagem r1) | atendido | `apps/api/src/common/at-least-one-field.pipe.ts`; `apps/api/src/plans/plans.controller.ts:~160-163`; `apps/api/src/plans/plans.service.ts` (`update`, `translateWriteError`) |
| (b) Corpo `{}` dá 400 com `details` `[{field:'body'}]`, antes do service; plano intacto (`updatedAt` igual) | atendido | `apps/api/test/plans-update.e2e-spec.ts:188-203` |
| CA3, edição: nome vazio ou só espaços, nome com mais de 60 caracteres, preço não numérico, preço menor ou igual a zero, preço acima de 9.999,99 dão 400 com campo indicado e plano intacto | atendido | `UpdatePlanDto` (`ValidateIf` + regras compartilhadas); `plans-update.e2e-spec.ts:~150-186` |
| CA4, edição: nome duplicado ignorando caixa e espaços dá 409 com mensagem que aponta o campo nome; manter o próprio nome com outra caixa é permitido | atendido | `plans.service.ts` (P2002); `plans-update.e2e-spec.ts:124, 226-245` |
| CA6: mudar o preço não altera o preço contratado da assinatura; `available` mostra o novo | atendido | `plans-update.e2e-spec.ts:256-281` |
| CA7: desativar tira o plano de `available`; assinatura intacta | atendido | `plans-update.e2e-spec.ts:283-300` |
| CA8: ativar devolve o plano a `available` | atendido | `plans-update.e2e-spec.ts:305-318` |
| CA12 (editar): id inexistente dá 404 com mensagem em português; id que não é uuid dá 400 | atendido | `plans-update.e2e-spec.ts:325-345`; `plans.service.ts` (P2025) |
| CA13: cliente recebe 403 e o plano fica intacto | atendido | `plans-update.e2e-spec.ts:347` |
| CA14: sem sessão dá 401 e o plano fica intacto | atendido | `plans-update.e2e-spec.ts:361` |
| (d) Nada fora do escopo alterado nesta rodada | atendido | O diff total contém apenas arquivos das Tarefas 1 a 5, e as Tarefas 1 a 4 não foram reavaliadas; nesta rodada só o pipe, o controller e o service foram tocados |

## Apontamentos bloqueantes
Nenhum.

## Observações (não bloqueantes)
1. Ordem dos pipes: o `ValidationPipe` global (`whitelist`, `transform`) roda antes do `AtLeastOneFieldPipe` do parâmetro. Por isso um corpo só com campos desconhecidos (por exemplo `{id: 'x'}`) é limpo pelo whitelist e também cai no 400 do campo `body`. Isso é coerente com o teste `it.each(['nameKey','priceCents','id'])` em `plans-update.e2e-spec.ts:205`, que passou.
2. O valor `null` num campo já é recusado antes, pelo DTO (`ValidateIf` só ignora `undefined`), então o pipe só precisa tratar `undefined`.
3. O teste do corpo vazio confere `details` no campo `body` e `updatedAt` intacto, o que prova que nada foi gravado.
