# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| Botão "Mostrar senha" troca o `type` entre `password` e `text`, com `aria-pressed` | atendido | `apps/web/src/features/auth/components/FormField.tsx` (botão com `aria-pressed={visible}` e `type={isPassword && visible ? 'text' : type}`). Teste de alternância completa (ida e volta) em `RegisterPage.test.tsx`. Ida com `aria-pressed` em `LoginPage.test.tsx`. |
| Cadastro: descrição acessível da senha é a dica | atendido | `RegisterPage.tsx` passa `passwordHint`. `RegisterPage.test.tsx` usa `toHaveAccessibleDescription('Mínimo de 8 caracteres, com letra e número')`. |
| Login: sem descrição acessível na senha | atendido | `LoginPage.test.tsx` usa `not.toHaveAccessibleDescription()` e confirma que a dica não está no DOM. O `LoginPage.tsx` não foi alterado. |
| Com erro de validação, a descrição é só a do erro | atendido | `describedBy = hasError ? errorId : hint ? hintId : undefined`. O teste espera a descrição exata "A senha deve ter no mínimo 8 caracteres.", sem a dica misturada. |
| `getByLabelText('Senha')` e `maxlength` 72 preservados | atendido | Os testes existentes de `maxlength` 72 passam. O rótulo continua ligado por `htmlFor`. |
| O botão não envia o formulário | atendido | `type="button"`. O teste confere `fetchMock` não chamado. |
| P3: `npm test` e `npm run lint` verdes | atendido | `npm test`: 6 arquivos e 57 testes passando. `npm run lint` (oxlint) terminou sem achados. |
| P1 e P2 não regridem | atendido | Os testes de login inválido e de e-mail repetido continuam passando. Nenhuma lógica de erro geral foi tocada. |
| Escopo: sem arquivo novo, sem valor literal, SVG inline com `aria-hidden` | atendido | O `git status` não mostra arquivo novo desta tarefa. Só aparecem os não rastreados da Tarefa 3. Classes usam tokens (`pr-xl`, `text-texto-suave`, `text-legenda`) e `--spacing-xl` existe em `index.css:32`. |

## Observações (não bloqueantes)
- **`RegisterPage.tsx` fora dos arquivos previstos:** é justificável. O `AuthForm` é compartilhado entre login e cadastro. A dica só pode ser exclusiva do cadastro se a página passar a prop. É uma linha, sem lógica extra.
- **Redação da dica:** "Mínimo de 8 caracteres, com letra e número" é mais clara que a do plano e mantém o mesmo conteúdo. Cobre a RN02 do PRD (mínimo de 8 caracteres, ao menos uma letra e um número). Não há desvio de conformidade.
- **Nome do botão:** a troca de "Mostrar senha" para "Ocultar senha" no `aria-label`, junto com `aria-pressed`, é redundante do ponto de vista semântico. O plano só pediu o `aria-pressed`, então isso não reprova.

## Apontamentos
Nenhum.
