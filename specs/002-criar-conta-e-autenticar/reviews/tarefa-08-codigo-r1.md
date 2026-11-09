# Parecer de Código — Tarefa 8 (rodada 1)

**Veredito:** APONTAMENTOS (1 bloqueante)

Rodei em `apps/web`: `npm test` (9 passam), `npm run lint` (limpo) e `npm run build` (ok, com 3 chunks lazy, um por placeholder).

## Apontamentos (bloqueiam)
1. **O `.env.example` com `VITE_API_URL=` vazio anula o fallback de `API_URL`.**
   - Onde: `apps/web/src/shared/http/client.ts:1` e `apps/web/.env.example:2`.
   - O código usa `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. O `??` só cai no fallback para `undefined`.
   - O comentário do exemplo manda "Copie para .env". Quem copia fica com `VITE_API_URL=""`, e o Vite injeta string vazia, não `undefined`.
   - O fetch passa a ir para `"" + "/auth/login"`, ou seja, para a origem do próprio Vite (`:5173`) e não para a API. O cadastro e o login quebram em silêncio, com 404 ou HTML no lugar do JSON.
   - Regra violada: o §4 do architecture manda o cliente de `shared/` ser o único ponto de acesso à API. Pelo critério do revisor ("URL de ambiente escrita no código"), o fallback é frágil nesse caminho.
   - Prejuízo concreto: o caminho feliz de setup que o próprio arquivo documenta é o que falha.
   - Correção possível: usar `||` em vez de `??`, ou escrever `VITE_API_URL=http://localhost:3000` no exemplo. Ver também a sugestão sobre ambiente de produção.
   - Falta teste para esse ponto: nenhum cobre a resolução da URL base, e por isso o defeito passou.

## Sugestões (não bloqueiam)
- **Produção sem a variável.** O fallback `localhost:3000` faz um build da Vercel sem `VITE_API_URL` apontar para localhost, sem aviso. Vale falhar alto em `import.meta.env.PROD` quando a variável faltar, ou deixar o `.env.example` com o valor de dev e nenhum fallback no código.
- **Nomes dos tokens de espaçamento.**
  - O `design-tokens.md` chama os tokens de `space-xxs` ... `space-xl`. O `@theme` registra `--spacing-xxs` ... `--spacing-xl`, que geram `p-sm` e `gap-md`.
  - O architecture §2 só dá o exemplo de cor (`--color-primaria` → `bg-primaria`), então a escolha é defensável. A divergência de nome continua e merece uma linha de registro.
  - `--spacing-sm` e outros também passam a valer em `w-sm`, `h-sm` e similares, sem relação com espaçamento.
  - O mapeamento por `--spacing-*` é o único que gera `p-`, `gap-` e `m-` no Tailwind v4. Nenhum valor literal de cor ou espaço aparece fora do `@theme`. A única exceção é o `3px`/`2px` do anel de foco, que vem do documento (estados de botão).
- **Rota de login fixa no cliente.** `'/login'` está escrita em `client.ts` (`window.location.assign('/login')`). O §4 permite isso ("em 401 leva ao login"), então não reprova. Uma constante nomeada deixaria a dependência de rota explícita e achável.
- **React Router sem major no architecture.** O §2 diz "React Router" sem versão, e o `package.json` traz `^8.5.1`. A nota da seção pede "Versão = linha major". Vale registrar a major via `/utf-architecture` ou Issue de manutenção, para as duas fontes contarem a mesma história.
- **Resíduos do template.**
  - `src/assets/` e o `icons.svg` do template, que só o `App.tsx` usava, podem ter ficado órfãos. Confira e remova se for o caso.
  - A remoção de `App.tsx`, `App.css` e `App.test.tsx` está correta: é código de template sem regra de negócio, e o teste dele é substituído pelo do cliente.
- **`Component` com cast do `default`.** O `lazy` repete o padrão `(await import(...)).default` três vezes. É aceitável por ser temporário (placeholders), e nada a fazer agora.

## Conferido e em conformidade
- O único `fetch` do front é o de `client.ts`. A busca no diff não acha outro, e `shared/` não importa rota nem feature.
- O cliente envia `credentials: 'include'`, converte `{ data }` e o erro (`ApiError` com `status` e `details`), e trata falha de rede separada (`NetworkError`).
- O 401 redireciona, exceto em `/auth/login`, `/auth/register` e `/auth/me`. Isso é testado com `it.each`, e query string é ignorada.
- O lazy loading por rota existe em `routes.tsx`, com chunks separados no build.
- O `@theme` traz os 16 tokens de cor com os valores do `design-tokens.md`, os 6 de espaçamento e as 2 famílias com pilha de fallback. O foco visível usa o token `--color-foco`.
- Os testes usam o contrato público (`request`, `ApiError`) e não acoplam a detalhe interno.
- Sobre o item "react-router v8" da sua lista: `createBrowserRouter`, `lazy` retornando `Component` e `react-router/dom` compilam e rodam. Não achei incompatibilidade.

## Observações fora do escopo deste diff
- Nenhuma.
