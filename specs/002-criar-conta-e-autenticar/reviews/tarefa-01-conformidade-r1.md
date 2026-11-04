# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

Rodei os testes. `npm run test:e2e` passou (2 arquivos, 3 testes) e `npm test` passou (1 teste).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA2/CA9 (parte desta tarefa): unicidade do e-mail garantida no banco, não por checagem prévia | atendido | `schema.prisma` (`email @unique`), `migration.sql` (`User_email_key`), `users.repository.e2e-spec.ts:44-52` (o segundo `create` com o mesmo e-mail dá `P2002` e o `count` fica em 1) |
| CA1 (parte desta tarefa): usuário gratuito, sem assinatura | atendido | O model `User` não tem papel nem `Subscription` (`schema.prisma`). Isso bate com o `architecture.md:306`, que diz que não existe coluna de papel. |
| CA4 (parte desta tarefa): a senha existe só como hash | atendido | A coluna é `passwordHash` (`migration.sql`). O hashing em si e as respostas da API ficam para tarefas seguintes, fora desta. |
| Suporte a CA8: `tokenVersion` para invalidar o token | atendido | `schema.prisma`, com `tokenVersion Int @default(0)`. O teste confere o valor 0 (`users.repository.e2e-spec.ts:34-41`). |
| Teste primeiro da tarefa: dois usuários com o mesmo e-mail, `P2002` no segundo | atendido | `users.repository.e2e-spec.ts`. O teste usa o Postgres real, passa pelo `UsersRepository` e pelo `PrismaService`, e a asserção é específica. |
| Campos do model conforme o `architecture.md:290` (`id`, `email` único, `passwordHash`, `tokenVersion`, `createdAt`) | atendido | `schema.prisma` |
| Arquivos previstos no plano | atendido | Todos existem: schema, migrations, `prisma.module`, `prisma.service`, `users.module`, `users.repository` e o teste ao lado. |
| CA3, CA5-CA8, CA10, CA11 e o restante de CA1, CA2 e CA9 (hash, normalização do e-mail, cookie, guard, front) | fora desta tarefa | Não são o escopo da Tarefa 1. |

## Apontamentos
(nenhum)
