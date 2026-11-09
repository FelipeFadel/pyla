# Parecer de Conformidade — Tarefa 9 (rodada 2)

**Veredito:** APROVADO

Rodei os testes em apps/web. `npm test` passou com 21 de 21 testes em 3 arquivos. `npm run lint` e `npm run build` rodaram sem erro. Não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 (na tela): cadastro envia e-mail e senha e leva à área interna | atendido | `RegisterPage.tsx` (`register` seguido de `navigate('/')`); teste "cadastra só pelo teclado" em `RegisterPage.test.tsx` confere URL e body |
| CA5 (na tela): login leva à área interna | atendido | `LoginPage.tsx`; teste "entra só pelo teclado" em `LoginPage.test.tsx` |
| CA6 (na tela): 401 mostra mensagem genérica sem recarregar e sem apagar o formulário | atendido | `AuthForm.tsx` (`generalError` com `role="alert"`); teste do 401 em `LoginPage.test.tsx` |
| CA10: falha de rede mostra erro em português, mantém o formulário e permite nova tentativa | atendido | `AuthForm.tsx` (catch sem limpar o estado); teste em `RegisterPage.test.tsx` cobre a nova tentativa com sucesso; teste de rede em `LoginPage.test.tsx` |
| CA11: senha com `maxlength` 72 | atendido | `FormField.tsx` e `AuthForm.tsx` (`maxLength={72}`); asserção nos dois arquivos de teste |
| CA11: rótulo associado a todo campo | atendido | `FormField.tsx` (`label htmlFor`); testes usam `getByLabelText` |
| CA11: erro ligado ao campo de forma programática | atendido | `FormField.tsx` (`aria-describedby` e `aria-invalid`); teste "liga cada erro" usa `toHaveAccessibleDescription` e `toBeInvalid` |
| CA11: operável só pelo teclado | atendido | testes com `tab` e `Enter`, sem clique |

## Correção da rodada 1
A correção fica só em `apps/web/src/index.css`. Ela registra os tokens `--text-*` e `--default-transition-duration: 120ms` em `@theme`. Os componentes passaram a usar `text-titulo-pagina` e `text-legenda`.

Isso não mexe em lógica, atributos de acessibilidade nem em texto. Não quebrou nenhum critério: testes, lint e build continuam verdes.

## Apontamentos
Nenhum.

Observações sem efeito no veredito:
- Não vi escopo inflado. O estado "Processando…" no botão é detalhe de UX e não contradiz a spec.
- Os placeholders de login e cadastro foram removidos, e as rotas apontam para as telas reais.
- A área interna segue como placeholder, previsto para a Tarefa 10.
