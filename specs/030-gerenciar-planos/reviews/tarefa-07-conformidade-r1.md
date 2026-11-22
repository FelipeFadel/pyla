# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

Testes: `npm test -w apps/web` passou (7 arquivos, 63 testes). `npm run lint` passou. `npx tsc -b` passou sem erros. Não rodei os e2e da API.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA17 (front): a sessão do front traz o papel (`/auth/me`) | atendido. `Session` ganhou `role: 'CUSTOMER' \| 'ADMIN'`. O papel vem da resposta de `/auth/me` via `useSession` e `RequireSession`, sem estado próprio do cliente. | `apps/web/src/features/auth/api/authApi.ts:19`, `apps/web/src/app/RequireSession.tsx` |
| CA17: menu mostra "Gerenciar planos" só para administrador | atendido. O `Link` é renderizado condicionalmente com `session.role === 'ADMIN'`, então fica fora do DOM para o usuário comum. O teste usa `queryByRole(...)).not.toBeInTheDocument()`, que prova a ausência no DOM. | `apps/web/src/features/auth/pages/HomePage.tsx:39-43`, `apps/web/src/features/auth/pages/HomePage.test.tsx` |
| CA17: o administrador abre `/admin/planos` | atendido. A rota fica sob `RequireSession` e `RequireAdmin`. | `apps/web/src/app/routes.tsx:29-39`, `apps/web/src/app/routes.test.tsx` (teste "abre a gestão de planos para o administrador") |
| CA17: usuário comum que digita `/admin/planos` volta à área interna | atendido. `RequireAdmin` faz `<Navigate to="/" replace />` para quem não é `ADMIN`. O teste confere o heading "Área interna" e a ausência de "Gestão de planos". | `apps/web/src/app/RequireAdmin.tsx:8-10`, `apps/web/src/app/routes.test.tsx` |
| Sem sessão (401) em `/admin/planos` leva ao login | atendido. O `RequireSession` pai trata o 401 com `Navigate` para `/login`, e há teste para isso. | `apps/web/src/app/RequireSession.tsx:17`, `apps/web/src/app/routes.test.tsx` |
| Teste primeiro: componente e rota, com administrador e com usuário comum | atendido. Há `HomePage.test.tsx` com 2 casos e 3 casos novos em `routes.test.tsx`. | `apps/web/src/features/auth/pages/HomePage.test.tsx`, `apps/web/src/app/routes.test.tsx` |
| Parte da API (`/auth/me` devolver `role`) | fora desta tarefa (Tarefa 1) | — |
| Listagem e formulários de planos | fora desta tarefa (Tarefa 8). `PlansAdminPage` é placeholder com `// TODO Tarefa 8`, conforme o plano. | `apps/web/src/features/plans/pages/PlansAdminPage.tsx` |

## Apontamentos
Nenhum apontamento bloqueante.

## Observações (não bloqueantes)
- A única mudança fora do que a tarefa prevê é o ajuste do mock `session` em `routes.test.tsx` para incluir `role: 'CUSTOMER'`. Isso é necessário por causa do novo tipo e fica dentro do escopo.
- Nada de lógica de papel foi duplicada no cliente além da checagem `role` sobre o dado vindo de `/auth/me`. A proteção real do endpoint continua na API (Tarefas anteriores).
- O link e o redirecionamento são só conveniência de UX. Isso é coerente com a spec, que não pede mais do que menu e redirecionamento no front.
