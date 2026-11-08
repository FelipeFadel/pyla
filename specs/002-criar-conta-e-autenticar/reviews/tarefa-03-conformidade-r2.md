# Parecer de Conformidade — Tarefa 3 (rodada 2)

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: cadastro válido responde 201 e cria usuário gratuito. Cookie `httpOnly` de sessão. O visitante entra já autenticado. | atendido (parte da API; a tela é de outra tarefa) | `auth.controller.ts:18-28`, `auth.service.ts:18-27`, `auth-register.e2e-spec.ts` ("responde 201", "emite o cookie pyla_session httpOnly, SameSite=Lax, 7 dias") |
| CA3: e-mail inválido ou senha fora da política (7, 73 bytes, sem letra, sem número) dá 400, indica o campo e não grava nada. | atendido | `register.dto.ts:24-41`; casos `it.each` com `details.field` e `user.count() === 0` |
| CA4: no banco só o hash bcrypt. Nenhuma resposta traz senha ou hash. | atendido | `auth.service.ts:19` (bcrypt, 12 rounds). A resposta é só `{id, email}`. Testes "sem senha nem hash", "grava só o hash bcrypt" e "o JWT … nada de senha ou hash". |
| CA2, CA5 a CA11 | fora desta tarefa | n/a |

Verificações extras:
- O limite de senha em 72 bytes UTF-8 foi confirmado por você e não é apontamento.
- `fileParallelism: false` em `vitest.config.e2e.ts` resolve o apontamento aceito na rodada 1.
- Não vi escopo inflado. `tokenVersion` no JWT vem do modelo da Tarefa 1 e serve ao CA8. A normalização de e-mail com trim e minúsculas é pré-requisito do CA2.

## Testes
- `npm run test:e2e`, rodada isolada: 4 arquivos, 30 testes, todos passaram.
- `npm test`: passou.
- `npm run lint`: sem erros.
- Duas execuções anteriores do e2e falharam. Uma falhou em `auth-register.e2e-spec.ts:121` (`user.count()` deu 1 em vez de 2). A outra foi de 19 passando em 30, com 1 erro. As duas foram simultâneas à suíte do outro revisor, que usa o mesmo banco. Reexecutei isolada e passou limpa.
- O ruído "segredo interno" no log é um teste do filtro de erros (`base-global.e2e-spec.ts`) e não é falha.

## Apontamentos
Nenhum.

Observação, fora do escopo de conformidade: `fileParallelism: false` só evita a corrida entre arquivos do mesmo processo vitest. Duas execuções simultâneas do e2e contra o mesmo banco ainda colidem, como aconteceu aqui. Isso é limitação do ambiente e não da tarefa.
