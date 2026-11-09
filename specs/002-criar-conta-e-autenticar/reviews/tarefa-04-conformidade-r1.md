# Parecer de Conformidade — Tarefa 4 (rodada 1)

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2: e-mail repetido é recusado com 400 e mensagem genérica, sem citar o e-mail | atendido | `apps/api/src/common/http-exception.filter.ts` (ramo `isUniqueViolation`, mensagem `UNIQUE_VIOLATION_MESSAGE`); testes em `apps/api/test/auth-register-duplicado.e2e-spec.ts:50-58` |
| CA2: vale com outras maiúsculas e espaços nas pontas | atendido | teste `auth-register-duplicado.e2e-spec.ts:60-67` (` A@X.com `). A normalização vem do `@Transform` da Tarefa 3 em `register.dto.ts`. |
| CA2: nenhuma conta duplicada | atendido | `expect(prisma.user.count()).toBe(1)` nos testes |
| CA2: a resposta não vaza dados internos | atendido | `expectRecusaGenerica` (`auth-register-duplicado.e2e-spec.ts:34-54`) confere que não há `details`, cookie, e-mail, `P2002`, `prisma`, `meta` nem `stack` |
| CA9: cadastros simultâneos com o mesmo e-mail geram exatamente uma conta, e o outro recebe a recusa do CA2 | atendido | teste `Promise.all` em `auth-register-duplicado.e2e-spec.ts:80-92` espera `[201, 400]` e uma só linha. A unicidade vem do banco (P2002), não de checagem prévia, como a spec exige em "Abandono no meio". |
| Erro de formato continua com `details` por campo (CA3 não regride) | atendido | `auth-register-duplicado.e2e-spec.ts:94-101` |

## Apontamentos
Nenhum.

## Observações, não bloqueantes
- **Testes.** Rodei `npm test` e deu 1/1 passando. No `npm run test:e2e`, uma execução completa passou 35/35, incluindo os 5 testes novos. As outras execuções tiveram falhas intermitentes, em arquivos e testes diferentes a cada vez. Os sintomas foram `count` 0 ou 1 inesperado, um 201 que veio 400 e `[400,400]` no teste simultâneo. A causa é ambiental. Durante a revisão havia outro processo `vitest run --config ./vitest.config.e2e.ts` rodando ao mesmo tempo no mesmo Postgres (`DATABASE_URL` aponta para `localhost:5432/pyla`). Os `deleteMany` de um processo apagam os dados do outro. Isso não é defeito da Tarefa 4, mas para a evidência da defesa vale rodar o e2e com um único processo ativo.
- **Escopo.** O ramo `P2002` do filtro é global e responde "Não foi possível concluir o cadastro." para qualquer violação de unicidade. Hoje só `User.email` é único, então fica dentro da Tarefa 4 e da previsão do plano (tradução do `P2002` no filtro). Se outra história criar outra unicidade, o texto terá de ser revisto.
- **`auth.service.ts`.** O plano o listava como arquivo previsto, mas ele não mudou. Não há perda, porque o filtro traduz o erro.
