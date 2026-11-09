# Parecer de Conformidade — Tarefa 9 (rodada 1)

**Veredito:** APROVADO

Rodei os testes em `apps/web`. `npm test` passou com 21 de 21 em 3 arquivos, `npm run lint` saiu sem erros e `npm run build` concluiu.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: cadastro envia e-mail e senha e leva à área interna sem passar pelo login. O cookie vem do backend (tarefas anteriores). | atendido | `RegisterPage.tsx:7-17`; `RegisterPage.test.tsx` "cadastra só pelo teclado e leva à área interna", que confere URL e corpo |
| CA5 (na tela): login com sucesso mostra a área interna | atendido | `LoginPage.tsx`; `LoginPage.test.tsx` "entra só pelo teclado e leva à área interna" |
| CA6 (na tela): 401 mostra a mensagem genérica da API sem sair da tela e sem recarregar | atendido | `AuthForm.tsx:31-36` e `role="alert"`. `shared/http/client.ts` não redireciona em 401 de `/auth/login` nem de `/auth/register`. `LoginPage.test.tsx` "mostra o erro genérico do 401…" confere que o e-mail continua preenchido e o botão volta a ficar habilitado |
| CA10: falha de rede mostra erro em português, mantém o formulário e permite tentar de novo | atendido | `NetworkError` em `client.ts`. `AuthForm` não limpa os estados no erro. Os dois testes de falha de rede conferem a mensagem e os valores preservados, e o de cadastro faz uma segunda tentativa com sucesso |
| CA11: senha limitada a 72 caracteres | atendido | `FormField.tsx` com `maxLength={72}` na senha, conferido nos dois testes |
| CA11: rótulo associado a todo campo | atendido | `FormField.tsx:27-29` com `label htmlFor`. Os testes usam `getByLabelText` |
| CA11: erro de validação ligado ao campo por `aria-describedby` | atendido | `FormField.tsx` com `aria-describedby`, `aria-invalid` e `<p id=…-erro>`. O teste usa `toHaveAccessibleDescription` e `toBeInvalid` nos dois campos |
| CA11: operável só pelo teclado | atendido | Os testes de cadastro e de login usam `user.tab()` e `{Enter}` sem clique. O botão é `type="submit"` dentro de `<form>` |

## Apontamentos
Nenhum bloqueante.

## Observações (não bloqueantes, sem exigir correção)
- **Escopo:** nada exceda a Tarefa 9 de forma relevante.
  - O `@testing-library/user-event` e o `testHelpers.tsx` são apoio de teste.
  - O texto "Processando…" com botão desabilitado durante o envio tem teste próprio. É comportamento que a spec não pediu, mas é pequeno, protege contra clique duplo (abandono no meio, CA9) e não é inflação de escopo.
  - Remover os placeholders de login e cadastro é consequência direta da tarefa.
- **Fora de escopo, corretamente:** o link entre login e cadastro, as fontes Saira e a validação de política no cliente não são exigidos por CA1, CA5, CA6, CA10 nem CA11.
- **Caso de borda (ligado ao CA3):** em `AuthForm.tsx:26-32`, se a API devolver `details` só com campos diferentes de `email` e `password`, nenhum erro aparece. A spec não define esse caso e o backend só emite esses dois campos, então não bloqueia.
- **Teste de CA6:** ele prova a mensagem e a permanência na tela. Não afirma explicitamente que não houve `location.assign`. Isso é coberto pelo teste do cliente HTTP e pela exclusão de `/auth/login` da lista de redirecionamento, então é suficiente.
