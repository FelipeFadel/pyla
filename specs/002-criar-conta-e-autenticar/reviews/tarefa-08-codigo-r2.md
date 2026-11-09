# Parecer de Código — Tarefa 8 (rodada 2)

**Veredito:** APROVADO

Rodei `npm test`, `npm run lint` e `npm run build` em `apps/web`. Todos passaram: 11 testes verdes, lint sem avisos, build ok.

## Apontamentos (bloqueiam)
Nenhum.

A correção da rodada 1 está suficiente. `client.ts:1` usa `import.meta.env.VITE_API_URL ||'http://localhost:3000'`, então um valor vazio cai no fallback. O teste parametrizado `com VITE_API_URL=%j chama %s` cobre os dois casos: `''` cai em `http://localhost:3000`, e uma URL definida é usada. Ele usa `stubEnv`, `resetModules` e import dinâmico, e depende só do comportamento observável, não de detalhe interno.

Conferi o diff contra o `architecture.md`.
- **§4, cliente HTTP:** o `fetch` está só em `shared/http/client.ts`. O cliente envia `credentials: 'include'`, devolve o conteúdo de `{ data }` e converte o erro em `ApiError` com `status`, `message` e `details`. Em 401 ele redireciona ao login, exceto em `/auth/login`, `/auth/register` e `/auth/me`. Os testes cobrem tudo isso.
- **Falha de rede:** vira `NetworkError`, não é engolida.
- **§4, estilo:** os tokens entram em `@theme` com nomes semânticos, sem cor literal no JSX. O foco visível está em `index.css`.
- **§4, lazy loading:** as rotas usam `lazy` com import dinâmico. O build gerou um chunk por placeholder.
- **§2, stack:** `tailwindcss`, `@tailwindcss/vite` e `react-router` constam da tabela de stack.
- **§2, segredos e URL de ambiente:** nada fica escrito no código além do fallback de desenvolvimento. O `.env.example` só tem o nome da variável, sem valor.

## Sugestões (não bloqueiam)
- `client.ts:1` ficou sem espaço antes de `'http://localhost:3000'` (`||'http...`). É um ajuste de formatação.
- O código usa `window.location.assign` e o teste faz `vi.stubGlobal('location')`. Isso funciona em jsdom, mas é um acoplamento leve ao ambiente.

## Observações fora do escopo deste diff
- O `architecture.md` §3 cita `*.test.tsx` para o web. O teste do cliente é `client.test.ts`, que é válido porque não há JSX.
- Os arquivos das fontes (Saira, Saira Stencil One) ainda não foram carregados. O próprio comentário em `index.css` diz que entram com a tela, então vale confirmar isso na Tarefa 9.
