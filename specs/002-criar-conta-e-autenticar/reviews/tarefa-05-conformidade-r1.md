# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

Testes rodados em `apps/api`: `npm run test:e2e` deu 6 arquivos e 39 testes passando. `npm test` deu 1 arquivo e 1 teste passando. Os logs de ERROR do `AllExceptionsFilter` vêm de uma rota de sonda de `base-global.e2e-spec.ts` e fazem parte do teste.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 (parte da tarefa): login com e-mail sem diferenciar maiúsculas e senha correta devolve 200 com cookie `httpOnly` de 7 dias | atendido | `auth.controller.ts` (rota `login`, `setSessionCookie` com `httpOnly` e `maxAge: SESSION_MAX_AGE_MS`), `dto/login.dto.ts` (trim e lowercase), `auth.service.ts` `login`. O teste `auth-login.e2e-spec.ts` (primeiro `it`) usa `' A@X.com '` e confere `HttpOnly` e `Max-Age=604800`. |
| CA6: senha errada ou e-mail inexistente dá 401 com mensagem genérica idêntica e sem cookie | atendido | `auth.service.ts` lança `UnauthorizedException` com a mesma mensagem nos dois casos e usa `compare` com hash falso quando o usuário não existe. O segundo `it` confere 401, ausência de `set-cookie` e corpos iguais (exceto o timestamp). |
| CA5 (parte da consulta à sessão atual e do front) | fora desta tarefa | Pertence às tarefas de sessão e de front. |
| CA4: nenhuma resposta devolve senha ou hash | atendido | O login devolve só `{id, email}`. O teste confere que `passwordHash` não aparece. |

## Apontamentos
Nenhum.

Observações, sem bloquear:
- O `LoginDto` valida o formato do e-mail e devolve 400 com `details`, e senha vazia também dá 400. A spec não pede isso para o login, mas só o CA3 trata de cadastro. Isso é validação de entrada do endpoint, não escopo inflado.
- O teste não confere o corpo do 401 com base em CA6 além da mensagem, e isso basta para o critério.
