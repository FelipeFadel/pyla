# Parecer de Código — Tarefa 2

**Veredito:** APROVADO

Não há apontamento bloqueante.

Verificações que fiz:
- `npm test` em `apps/web`: 5 arquivos e 50 testes passam.
- `npm run lint` não reporta nada.
- `npm run build` conclui sem erro.
- Conferi no CSS gerado (`dist/assets/index-wH76GvCA.css`) cada classe nova ou alterada do diff. Todas geram regra: `shadow-card`, `border-desabilitado`, `p-md`, `p-sm`, `px-sm`, `py-xs`, `gap-xs`, `gap-md`, `max-w-formulario`, `text-legenda`, `text-corpo`, `text-texto-suave`, `text-titulo-pagina`, `text-primaria-forte`, `bg-superficie`, `font-display`, `rounded` e `min-h-screen`.
- `max-w-formulario` gera `max-width:var(--container-formulario)` e `shadow-card` usa a sombra do `@theme`. Não há `max-w-md`, então a regra do `index.css.test.ts` é respeitada.

Aderência ao `architecture.md` §4 e aos tokens:
- Não há cor, espaçamento ou sombra literal no JSX (`AuthForm.tsx:47-90`, `FormField.tsx:29-44`).
- Todo campo mantém `<label htmlFor>`.
- O erro continua ligado por `aria-describedby` e `aria-invalid` (`FormField.tsx:41-42`).
- O foco visível vem do `:focus-visible` global do `index.css`.
- `components/` não conhece rota.
- O "Pyla" é o único `h1`. Os testes consultam por papel, rótulo e placeholder (`LoginPage.test.tsx:17-24`, `RegisterPage.test.tsx:18-25`).

Arquivos fora dos previstos:
- `LoginPage.tsx` e `RegisterPage.tsx` só perderam a prop `title`, que ficou sem uso depois da mudança. Isso é consequência necessária e não deixa código morto.
- `routes.test.tsx` trocou `heading 'Entrar'` por `button 'Entrar'` (e `'Criar conta'` no cadastro). É necessário, porque o `h1` agora é "Pyla". A consulta continua por papel, e o botão de envio é o único elemento com esse nome nesse momento.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)
- O `placeholder` não tem classe de cor própria (`FormField.tsx:39`). Fica com a cor padrão do navegador, que pode ter contraste baixo sobre `bg-superficie`. Se o protótipo definir uma cor, vale usar `placeholder:text-texto-suave` na revisão visual (P4).
- `min-h-screen` e `items-center` (`AuthForm.tsx:47`) são utilitários padrão do Tailwind, não tokens. Não são valores literais, então aceitei. Se o projeto quiser rigor total, registre essa exceção.
- Com o `title` removido, as duas telas ficam com o mesmo `h1` "Pyla". A distinção entre login e cadastro depende do botão e, na Tarefa 3, das abas com `aria-current`. Fique atento para que a Tarefa 3 deixe isso claro a leitores de tela.
- Os testes novos de Login e Register são idênticos (marca, subtítulo e placeholders). São só dois e aceitáveis. Se aparecerem mais telas de auth, considere um teste de `AuthForm` e deixe as páginas só com o que muda.

## Observações fora do escopo deste diff
- Nenhuma.
