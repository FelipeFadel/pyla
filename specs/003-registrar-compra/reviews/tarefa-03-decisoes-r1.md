# Decisões — Tarefa 3, rodada 1

Triagem feita seguindo a instrução do usuário: "siga com as decisões recomendadas com base na spec e no PRD" (delegação dada na sessão).

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `productId: null` passa pela validação e vira 500 do Prisma, em vez de 400 | código | aceito | Viola a regra de entrada do architecture.md §2.1 (requisição malformada recusada antes do service). Está no código da própria tarefa. |

Sugestões do revisor de código (não entram na triagem): não promovidas a apontamento.
