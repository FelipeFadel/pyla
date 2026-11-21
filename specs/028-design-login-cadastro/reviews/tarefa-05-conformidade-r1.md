# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| Alerta geral (`role="alert"`) mostra o título do contexto no login ("Erro de autenticação") | atendido | `LoginPage.tsx:16`, `AuthForm.tsx:89`, teste em `LoginPage.test.tsx` (`within(alerta).getByText('Erro de autenticação')`) |
| Alerta geral mostra o título do contexto no cadastro ("Erro no cadastro") | atendido | `RegisterPage.tsx:16`, teste em `RegisterPage.test.tsx` (`within(alerta).getByText('Erro no cadastro')`) |
| A mensagem da API aparece sem alteração, em elemento próprio | atendido | `AuthForm.tsx:90` (`<p>{generalError}</p>`). Os testes usam `getByText` com a frase exata nos dois contextos. |
| Campo inválido com `aria-invalid`, mensagem ligada por `aria-describedby` e destaque visual | atendido | `FormField.tsx:71-73` e `FormField.tsx:92`. O teste novo em `RegisterPage.test.tsx` usa `toBeInvalid`, `toHaveClass('border-perigo')` e `toHaveAccessibleDescription('Informe um e-mail válido.')`. |
| Campo válido sem destaque | atendido | O mesmo teste afirma `Senha` `not.toHaveClass('border-perigo')`. |
| Erro nunca só por cor (P4) | atendido | Ícone SVG com `aria-hidden`, sempre junto de texto, em `AuthForm.tsx:72-90` e `FormField.tsx:93-108`. |
| Só tokens, sem valor literal (P3) | atendido | As classes usadas são `border-perigo`, `bg-perigo-fundo`, `text-perigo`, `gap-xxs` e `gap-xs`. `--color-perigo`, `--color-perigo-fundo` e `--spacing-xxs` existem em `index.css`. |
| P1: mensagem genérica no 401 | atendido | O teste de `LoginPage.test.tsx` continua afirmando "E-mail ou senha inválidos." |
| P2: mensagem da API no 400, sem revelar que o e-mail existe | atendido | O front só renderiza `generalError`, sem alteração. A frase "já está cadastrado" não aparece em `apps`, `specs` nem em `docs/architecture.md`. |
| P3: testes e lint | atendido | `npm test`: 6 arquivos e 58 testes passaram. `npm run lint` rodou sem erros. |
| Sem arquivo novo e sem escopo extra | atendido | `git status --short` não mostra arquivo novo desta tarefa. Só `AuthTabs.tsx` e `AuthTabs.test.tsx` estão não rastreados, e são da Tarefa 3. O diff toca apenas os arquivos previstos. |

## Apontamentos
Nenhum.

Observação sem efeito no veredito: o teste do campo inválido só existe no cadastro. No login o erro de campo vem do mesmo `FormField`, então a cobertura vale para os dois.
