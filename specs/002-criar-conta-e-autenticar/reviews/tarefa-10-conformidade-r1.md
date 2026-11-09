# Parecer de Conformidade — Tarefa 10

**Veredito:** APROVADO

Rodei os comandos em `apps/web`. `npm test` passou com 28 testes em 4 arquivos, `npm run lint` não apontou nada e `npm run build` concluiu.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 (front): sem sessão, expirada ou inválida, a rota interna leva ao login | atendido. Um 401 em `/auth/me` dispara `<Navigate to="/login" replace />`. Só `/` fica atrás do guard, e `/login` e `/cadastro` continuam abertos. | `apps/web/src/app/RequireSession.tsx:16-18`, `apps/web/src/app/routes.tsx:19-28`. Testes em `apps/web/src/app/routes.test.tsx:17-24` (401 vai ao login) e `:77-83` (`/cadastro` não chama a API). |
| CA7: o guard cobre sessão expirada ou invalidada com o app aberto | atendido para a abertura da rota. A sessão é checada a cada montagem do guard, e qualquer 401 leva ao login. | `apps/web/src/features/auth/api/useSession.ts` |
| CA8 (front): o botão de logout chama a API, remove o cookie e leva ao login | atendido. `POST /auth/logout` é chamado e, em seguida, `navigate('/login', { replace: true })`. A remoção do cookie e a invalidação do token ficam na API (Tarefa 7). | `apps/web/src/features/auth/pages/HomePage.tsx:12-26`, `apps/web/src/features/auth/api/authApi.ts`. Teste em `apps/web/src/app/routes.test.tsx:51-61`, que confere o método POST, a URL e a chegada ao login. |
| CA8: logout em outro dispositivo, depois 401 com o app aberto | atendido na parte que o front controla. O 401 no logout navega ao login, e o 401 em `/auth/me` também. | `apps/web/src/features/auth/pages/HomePage.tsx:19-20` |
| Área interna mínima com o e-mail e o botão de logout | atendido | `apps/web/src/features/auth/pages/HomePage.tsx:29-47`. Teste em `apps/web/src/app/routes.test.tsx:26-32`. |
| CA10, rede falhando no `/auth/me` e no logout (por analogia, pois o CA10 só cita cadastro e login) | atendido. A tela mostra erro em português, nunca fica em branco, e oferece "Tentar de novo" ou mantém a tela do usuário. | `apps/web/src/app/RequireSession.tsx:20-35`, `apps/web/src/app/routes.test.tsx:44-49` e `:63-73` (o texto "Não foi possível conectar" vem de `shared/http`). |
| CA11 (acessibilidade nas telas novas) | atendido. `role="status"` no carregamento, `role="alert"` nos erros, `<main>` e `<h1>`, e botões nativos operáveis por teclado. Os campos de senha e de rótulo não se aplicam a esta tela. | `apps/web/src/app/RequireSession.tsx`, `apps/web/src/features/auth/pages/HomePage.tsx` |
| Fora de escopo: nenhuma tela de compras, resumo ou histórico | respeitado. A página só prova a sessão e tem o logout. | `apps/web/src/features/auth/pages/HomePage.tsx` |

## Apontamentos
Nenhum bloqueante.

Observações não bloqueantes:
- As decisões do orquestrador não estão na spec, mas são compatíveis com ela. Elas são o erro de rede com "Tentar de novo", o 401 no logout indo ao login, o logout com falha de rede ficando na tela com erro, e `/login` e `/cadastro` sem redirecionar quem já tem sessão. Nenhuma contradiz um critério, e a spec manda o 401 levar ao login e a rede que cai mostrar erro sem tela em branco.
- O 401 no logout não tem teste. Isso fica registrado como lacuna de cobertura. O caminho é curto e faz parte do CA7 e do CA8.
- Se uma chamada futura retornar 401 com a página já aberta, o front só reage quando a rota é montada de novo. Hoje a página mínima não faz outras chamadas, então isso não pertence a esta tarefa.
