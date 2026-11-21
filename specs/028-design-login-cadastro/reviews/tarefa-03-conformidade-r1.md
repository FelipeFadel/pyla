# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

Não li spec.md porque a tarefa é de manutenção sem spec. Usei os critérios P1 a P4 e o texto da Tarefa 3 do plan.md como referência.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| P3: `npm test` verde | atendido (6 arquivos, 54 testes passando) | `apps/web` |
| P3: `npm run lint` verde | atendido (oxlint sem saída de erro) | `apps/web` |
| Abas são links (`<Link>`), com `nav` e `aria-current="page"` na aba atual | atendido | `AuthTabs.tsx:15-31` |
| Rotas vêm das páginas, `components/` não as fixa | atendido | `LoginPage.tsx` (tabs e footer), `RegisterPage.tsx` (tabs e footer), `AuthTabs.tsx` só recebe props |
| Só tokens, sem valores literais | atendido (`bg-primaria`, `p-xxs`, `gap-xs`, `text-legenda` etc.) | `AuthTabs.tsx:17,26-27`, `AuthForm.tsx` (rodapé) |
| Teste: aba "Entrar" com `aria-current="page"` em `/login` e clique levando a `/cadastro` | atendido | `AuthTabs.test.tsx:20-38` |
| Teste: sentido inverso, de `/cadastro` para `/login` | atendido | `AuthTabs.test.tsx:40-53` |
| Teste: rodapé nos dois sentidos | atendido | `AuthTabs.test.tsx:55-73` |
| Sem rota nova nem chamada de API nova | atendido (o diff só toca componentes e páginas) | — |
| P1 e P2 preservados | atendido (lógica de erro intacta, testes existentes passam) | `AuthForm.tsx` |
| Fora de escopo (dica de senha, estilo de erro) | respeitado | — |

## Observações (não bloqueantes)
- O ajuste em `RegisterPage.test.tsx` (dois `user.tab()` a mais antes do campo de e-mail) se justifica. As duas abas entram na ordem de tabulação antes do formulário, uma consequência direta da tarefa. A mudança não enfraquece nenhuma asserção.
- Para provar que a navegação ocorreu, os testes verificam o botão de envio, que só existe na tela de destino. Os rótulos são distintos ("Entrar" no login, "Criar conta" no cadastro) e as abas são links, então não há ambiguidade.
- O teste do rodapé usa `getByText(...).parentElement`, que depende da estrutura do DOM. Isso é questão de estilo, não de conformidade.

## Apontamentos
Nenhum.
