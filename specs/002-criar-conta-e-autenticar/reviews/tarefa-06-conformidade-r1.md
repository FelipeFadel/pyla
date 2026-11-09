# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

Rodei `npm run test:e2e` (7 arquivos, 47 testes passando), `npm test` (1 passando) e `tsc --noEmit` (sem erros). Os logs de ERROR no e2e vêm da sonda de `base-global.e2e-spec.ts`, que é intencional.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7: sem cookie dá 401 | atendido | `jwt-auth.guard.ts:30-31`; teste `auth-me.e2e-spec.ts:50` |
| CA7: sessão inválida dá 401 (cookie adulterado, lixo, `tokenVersion` divergente, usuário inexistente) | atendido | `jwt-auth.guard.ts:33-45`; testes `auth-me.e2e-spec.ts:56-96` |
| CA7: sessão expirada dá 401 | atendido | `jwt.verifyAsync` rejeita; teste com `expiresIn: -10` em `auth-me.e2e-spec.ts:67` |
| CA7: só cadastro e login são abertos | atendido | `@Public()` apenas em `register` e `login` (`auth.controller.ts:30,41`); guard global via `APP_GUARD` (`auth.module.ts:23`); teste em `auth-me.e2e-spec.ts:108` |
| CA5: consulta à sessão devolve id e e-mail | atendido | `GET /auth/me` em `auth.controller.ts:25`; teste `auth-me.e2e-spec.ts:100` (200, `{ id, email }`, sem hash) |

## Divergências declaradas do plan
- **cookie-parser em `setup-app.ts` em vez de `main.ts`:** aceitável. `main.ts` chama `configureApp`, então a produção usa o parser. O e2e também passa pelo mesmo caminho, e isso dá mais fidelidade do que registrar em `main.ts`. Nenhum critério é violado.
- **`package.json` inalterado:** aceitável. `cookie-parser` e `@types/cookie-parser` já estão declarados (`package.json:36,48`), e o diff não precisou tocar nele.
- **`APP_GUARD` em `auth.module.ts` em vez de `app.module.ts`:** aceitável. O guard continua global. O teste `GET /` retornando 401 prova isso.
- **`GET /` agora retorna 401 (decisão pendente do usuário):** consistente com o CA7, que fala em "qualquer rota interna" e diz que só cadastro e login são abertos. O ajuste em `app.e2e-spec.ts` para 401, com TODO, está de acordo com a spec. A decisão final continua sendo do usuário.

## Apontamentos
Nenhum.

Observação não bloqueante, que é do revisor de código: em `auth.controller.ts`, o tipo `Request` no `@Req()` não é importado de `express`, então resolve para o `Request` global. O `tsc` passa, mas vale uma olhada.
