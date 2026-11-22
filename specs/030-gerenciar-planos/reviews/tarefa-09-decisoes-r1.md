# Decisões — Tarefa 9, rodada 1

> Triagem feita pelo agente orquestrador, por delegação expressa do usuário ("roda uma de cada vez tomando as decisões com base no que recomenda"). O usuário pode rever qualquer decisão abaixo antes do PR.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O anti duplo clique usa um único `pendingId` em `PlansAdminPage.tsx`: ativar/desativar dois planos em sequência reabilita o botão do primeiro durante a chamada e o `finally` apaga a pendência do outro | código | aceito | Defeito real de concorrência no estado da UI, com efeito visível (PATCH duplicado) e fácil de reproduzir por teste. A correção é localizada: guardar as pendências por plano (conjunto de ids) e remover só o id que terminou. |
| 2 | O foco do teclado se perde ao fechar a edição (Salvar, Cancelar, salvar sem mudanças, 404) e quando o botão de ativar/desativar fica `disabled` | código | aceito | A spec (CA20) exige a tela operável só pelo teclado, e perder o foco obriga a tabular desde o topo a cada ação. É defeito de acessibilidade real, não só estilo. A correção é pequena: devolver o foco ao botão "Editar plano X" ao fechar a edição e não tirar o foco do botão de alternar durante a chamada (por exemplo `aria-disabled` com clique ignorado em vez de `disabled`). |

## Sugestões do revisor de código (não entram na triagem)
- Um 404 alheio fechar a edição de outro plano, mapeamento de erro e texto de fallback duplicados, props de `PlanForm` (união discriminada), formulário de edição longe da linha, anúncio de sucesso por `role="status"`, `flex` direto no `td`, `aria-label` do form repetindo o do botão, `trim` ao comparar/enviar o nome, testes extras de concorrência: não foram promovidas a apontamento e não entram na rodada 2. Ficam como candidatas de refino. Os testes de concorrência e de retorno de foco entram na rodada 2 apenas porque provam os dois apontamentos aceitos.
