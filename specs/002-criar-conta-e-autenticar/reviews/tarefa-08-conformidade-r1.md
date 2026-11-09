# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

Rodei em apps/web: `npm test` (9 de 9 passam), `npm run lint` (sem erros) e `npm run build` (ok).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Teste do cliente: `credentials: 'include'` | atendido | `apps/web/src/shared/http/client.test.ts:25-32` e `client.ts:55` |
| Teste do cliente: conversão de `{ data }` | atendido | `client.test.ts:45-49` e `client.ts:73` |
| Teste do cliente: conversão do erro em `ApiError` (status, message, details) | atendido | `client.test.ts:51-69` e `client.ts:66-70` |
| Teste do cliente: 401 redireciona ao login (`assign('/login')`) | atendido | `client.test.ts:80-85` e `client.ts:63-65` |
| Teste do cliente: 401 em `/auth/login`, `/auth/register` e `/auth/me` não redireciona | atendido | `client.test.ts:87-96` e `client.ts:4` |
| CA7, parte do front (401 leva ao login) | atendido na infraestrutura | `client.ts:63-65` |
| CA10, infraestrutura (falha de rede distinguida por `NetworkError`, com mensagem em português) | atendido na infraestrutura; formulário fica para a Tarefa 9 | `client.ts:22-27, 58-60` |
| Estilo: `@theme` com os tokens, plugin do Tailwind | atendido | `index.css:1-35` e `vite.config.ts:2,8` |
| Rotas `/login`, `/cadastro`, `/` | atendido | `routes.tsx` e `main.tsx` |
| CA11 (foco visível, base de acessibilidade) | parcial, só a base global; as telas são da Tarefa 9 | `index.css:40-43` |
| CA1, CA5, CA6 | fora desta tarefa (telas nas Tarefas 9 e 10) | n/a |

## Apontamentos
Nenhum bloqueante.

Observações sobre o que você perguntou, nenhuma delas reprova:
- **Remoção de `App.tsx`, `App.test.tsx` e `App.css`:** não excede o escopo. O `main.tsx` previsto na tarefa deixa de usar `App`, então os arquivos do template ficariam órfãos. O teste removido só validava o template e nenhum critério da spec depende dele.
- **`app/placeholders/`:** o plano prevê `apps/web/src/app/` (rotas) e os placeholders são mínimos, marcados como esqueleto das Tarefas 9 e 10. Não implementam regra, formulário nem chamada à API, então não há escopo inflado. As rotas dependem deles para existir.
- **`apps/web/.env.example`:** não está na lista de arquivos previstos, mas só documenta `VITE_API_URL`, que o cliente HTTP usa (`client.ts:1`). Não adiciona comportamento, então é inofensivo.
- **react-router v8 (`^8.5.1`):** o build e os testes passam e a spec não fixa versão.
- **Exceção do `/auth/me` no redirecionamento:** vem do texto literal da tarefa e atende ao CA7 desde que a Tarefa 10 trate o 401 do `/auth/me` (sessão ausente) levando ao login. Isso fica como lembrete para a Tarefa 10. Sem isso, "sem cookie ao abrir a área interna" não redirecionaria.
- **Detalhe sem efeito prático:** o `ApiError` usa o `message` da API tal como vem. Isso é adequado ao CA6, que pede mensagem genérica idêntica.
