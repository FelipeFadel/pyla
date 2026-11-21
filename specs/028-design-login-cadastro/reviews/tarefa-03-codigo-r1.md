# Parecer de Código — Tarefa 3

**Veredito:** APROVADO

Rodei os testes e o build no working tree:
- `npm test`: 54 testes passam em 6 arquivos.
- `npm run lint`: sem erros.
- `npm run build`: concluído.

## Apontamentos (bloqueiam)
Nenhum.

Conferi os pontos do despacho:
- **Tokens:** não há valor literal no JSX de `AuthTabs.tsx` nem no trecho novo de `AuthForm.tsx`. Conferi no CSS gerado (`dist/assets/index-*.css`) que estas classes geram regra: `gap-xxs`, `p-xxs`, `py-xs`, `gap-xs`, `pt-sm`, `bg-superficie-media`, `border-superficie-media`, `text-texto-suave`, `text-legenda`, `text-primaria`, `text-superficie`, `bg-primaria`, `grid-cols-2` e `font-semibold`. Nenhuma classe de espaçamento é usada como largura, então a regra de `index.css.test.ts` não é violada.
- **Rota:** os destinos (`to`) e o `current` vêm das páginas (`LoginPage.tsx`, `RegisterPage.tsx`). Os componentes só recebem props, então não há caminho `/login` ou `/cadastro` escrito neles. Os dois importam `Link` de `react-router` (`AuthTabs.tsx:1`, `AuthForm.tsx:4`). Não considero isso conhecer rota, porque `Link` é só o mecanismo de navegação. A regra do `architecture.md:261` é ambígua nesse ponto (veja a sugestão 1).
- **Acessibilidade:**
  - O `nav` tem nome (`aria-label`).
  - `aria-current="page"` só aparece na aba atual.
  - Os dois links têm texto claro.
  - A ordem de foco é aba, aba, campos, botão, link do rodapé, o que segue a ordem visual.
  - O foco visível vem do `:focus-visible` global em `index.css`.
  - O nome duplicado "Criar conta" ou "Entrar" (aba, rodapé e, no botão de envio, também o texto do botão) é aceitável. Os três têm papéis diferentes (link ou botão), e os links estão em regiões distintas: um dentro do `nav` com nome, outro no rodapé com o texto "Não tem uma conta?" ao lado.
- **Código morto:** não encontrei. A interface `AuthTab` é exportada e usada em `AuthForm.tsx`.
- **Tipagem:** as props novas estão tipadas (`tabs: AuthTab[]`, `footer: { text; linkLabel; to }`).
- **Testes:** usam consulta por papel e nome (`navigation`, `link`, `button`), como o `architecture.md` pede. Cobrem as quatro direções de navegação e o `aria-current`.

## Sugestões (não bloqueiam)
1. **`architecture.md:261` ("components/ de feature não conhecem rota").** A regra é ambígua quanto a importar `react-router`. Vale o usuário decidir se `Link` em `components/` é aceito e, se for, escrever isso no documento. Hoje o código segue a leitura mais branda, em que os destinos vêm por props.
2. **`current` redundante.** `AuthTab.current` (`AuthTabs.tsx:6`) repete o que o roteador já sabe. `NavLink` calcularia o `aria-current` sozinho e eliminaria o campo e o `tab.current ? … : …` das duas páginas. O ganho é pequeno, e a versão atual é explícita e testada. Só vale se o componente for crescer.
3. **Rodapé em dois fragmentos.** `footer` é um objeto com `text`, `linkLabel` e `to` (`AuthForm.tsx:9`). Se um dia a frase precisar de outra ordem ou de tradução, isso vai limitar. Hoje serve.
4. **Teste frágil no cadastro (`RegisterPage.test.tsx`, `user.tab()` x3).** Os comentários `// aba Entrar` e `// aba Criar conta` ajudam. Mesmo assim o teste quebra se a ordem do DOM mudar. Uma alternativa é focar o campo com `user.click(getByLabelText('E-mail'))` ou checar a ordem em um teste só dela. Isso perderia a verificação de que o formulário é alcançável por teclado, então não é necessário.
5. **Fragilidade dos testes de rodapé.** `getByText(...).parentElement as HTMLElement` (`AuthTabs.test.tsx:59` e `:69`) depende de a estrutura ser `div > span + a`. Um `aria-label` ou `role="group"` no rodapé permitiria consultar por papel. O teste também usa `as`, que contorna o tipo.
6. **Ordem dos imports em `AuthForm.tsx`.** `import { Link } from 'react-router'` ficou depois dos imports locais (linha 4). É só convenção.
7. **Teste do `aria-current` no destino.** `AuthTabs.test.tsx:36` usa `getByRole('navigation')` sem o nome, o que quebraria se aparecesse um segundo `nav`. Reaproveite o nome usado na linha 24.

## Observações fora do escopo deste diff
- Nada a registrar como Issue de manutenção.
