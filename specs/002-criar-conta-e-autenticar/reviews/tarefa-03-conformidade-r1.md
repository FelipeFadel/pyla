# Parecer de Conformidade — Tarefa 3 (rodada 1)

**Veredito:** APONTAMENTOS (REPROVADO)

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: e-mail válido e senha dentro da RN02 criam a conta com 201, cookie `httpOnly` e usuário gratuito (sem `Subscription`) | atendido no código, mas a prova nos testes é instável (apontamento 1) | `auth.controller.ts:16-28`, `auth.service.ts:18-27`, `auth-register.e2e-spec.ts:45-100` |
| CA3: e-mail inválido ou senha fora da política dá 400, indica o campo e não grava nada | atendido no código, mas a prova nos testes é instável (apontamento 1) | `register.dto.ts:30-41`, `auth-register.e2e-spec.ts:128-193` |
| CA4: no banco só o hash, e nenhuma resposta devolve senha ou hash | atendido no código, mas a prova nos testes é instável (apontamento 1) | `auth.service.ts:19`, `auth.controller.ts:28` (devolve só `{id,email}`), `auth-register.e2e-spec.ts:45-62`, `:102-109` |
| CA2, CA5 a CA11 | fora desta tarefa | n/a |

Escopo: não vi nada além do pedido. O `tokenVersion` no JWT, a normalização do e-mail no DTO e o rodízio de `UsersService` preparam CA2, CA5 e CA8, mas não implementam esses critérios.

Testes:
- `npm test`: passou (1/1).
- `npm run lint`: sem saída de erro.
- `npm run test:e2e`: rodei 4 vezes e falhou em 3, sempre 1 teste de `auth-register.e2e-spec.ts` diferente a cada vez.
  - Rodada 1: `aceita senha acentuada`. Esperava 2 usuários e recebeu 1, apesar de os dois POSTs terem devolvido 201.
  - Rodada 2: passou 30/30.
  - Rodada 3: `responde 201 com { id, email }...`.
  - Rodada 4: `o JWT do cookie tem sub e tokenVersion...`.

## Apontamentos
1. **O e2e do cadastro é intermitente, então não prova CA1, CA3 nem CA4 de forma confiável.** — `apps/api/test/auth-register.e2e-spec.ts:27` e `apps/api/src/users/users.repository.e2e-spec.ts:24`
   Critério violado: o método exige que teste que não roda de forma confiável não conte como critério atendido. Ele afeta CA1 ("conta é criada"), CA3 ("nada é gravado") e CA4 ("no banco só o hash").
   Evidência:
   - O `vitest.config.e2e.ts` roda os arquivos `*.e2e-spec.ts` em paralelo, e todos usam o mesmo banco e a mesma tabela `User`.
   - Os dois arquivos fazem `prisma.user.deleteMany()` no `beforeEach`. Um apaga as linhas do outro no meio do teste.
   - Isso explica os sintomas: contagem 1 em vez de 2, `findUniqueOrThrow` sem achar o usuário, e `count()` diferente do esperado.
   - A rodada 2 passou 30/30 sem mudar nada no código, o que confirma a corrida entre arquivos.
   - A causa está na forma como o teste novo divide o banco com o teste da Tarefa 1. Ele não cria isolamento (por exemplo, rodar os arquivos em série ou usar e-mails únicos por arquivo, sem `deleteMany` global).

Observação, sem bloqueio: a spec diz "8 a 72 caracteres" e o DTO limita em 72 bytes UTF-8 (`register.dto.ts:11-24`). Uma senha de 40 caracteres acentuados é recusada, embora a spec fale em caracteres. O plano já fala em "73 bytes" e o bcrypt trunca em 72 bytes, então parece uma decisão consciente. Vale confirmar com o usuário, porque o CA11 limita o campo do front em 72 caracteres.
