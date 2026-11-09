# Parecer de Conformidade — Tarefa 8 (rodada 2)

**Veredito:** APROVADO

Rodei em apps/web: `npm test` (11/11 passam), `npm run lint` (sem alertas) e `npm run build` (tsc e vite OK).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Tarefa 8: teste prova `credentials: 'include'` | atendido | client.test.ts, "envia credentials include"; client.ts:`credentials: 'include'` |
| Tarefa 8: conversão de `{ data }` | atendido | client.test.ts, "devolve o conteúdo de data"; client.ts `return json?.data` |
| Tarefa 8: conversão do erro (status, message, details) em `ApiError` | atendido | client.test.ts, "converte o erro da API em ApiError" |
| CA7: 401 em rota interna leva ao login | atendido | client.ts, `window.location.assign('/login')`; teste "em 401 leva ao login e ainda rejeita com ApiError" |
| CA6/CA5: 401 em `/auth/login`, `/auth/register` e `/auth/me` não redireciona | atendido | client.ts, `PATHS_WITHOUT_LOGIN_REDIRECT`; `it.each` com os 3 caminhos |
| CA10: falha de rede distinguível (`NetworkError`, mensagem em português) | atendido | client.ts, `NetworkError`; teste "distingue falha de rede com NetworkError" |
| Rotas `/login`, `/cadastro` e `/` com lazy loading, estilo (Tailwind e tokens) e dependências | atendido | routes.tsx, index.css, vite.config.ts, package.json, main.tsx |
| Correção da rodada 1 (`VITE_API_URL` vazio usa o fallback) | atendido, sem regressão | client.ts:1 usa `||`; o teste parametrizado cobre `''` e uma URL real |
| CA1, CA5, CA10 e CA11: telas e formulários | fora desta tarefa | Tarefas 9 e 10; aqui só há placeholders |

## Apontamentos
Nenhum.

Observações não bloqueantes, que são do revisor de código:
- client.ts:1 está sem espaço antes do `'http://localhost:3000'`.
- Os placeholders são mínimos e estão marcados como tais nos comentários. Não há escopo inflado.
- `App.tsx`, `App.css` e `App.test.tsx` foram removidos porque eram o scaffold do Vite. Isso é coerente com a troca do ponto de entrada por `RouterProvider`.
