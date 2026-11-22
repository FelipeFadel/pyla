# Decisões — Tarefa 8, rodada 1

> Triagem feita pelo agente orquestrador, por delegação expressa do usuário ("roda uma de cada vez tomando as decisões com base no que recomenda"). O usuário pode rever qualquer decisão abaixo antes do PR.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Em `PlanForm.tsx`, quando a API devolve `details` sem nenhum campo conhecido (`name` ou `price`), o erro é engolido: nenhum erro de campo e nenhuma mensagem geral aparecem, e o clique em "Criar plano" parece não fazer nada | código | aceito | É um defeito real de comportamento, com prejuízo direto ao usuário (falha silenciosa), e a correção é pequena e localizada: cair na mensagem geral (`role="alert"`) quando nenhum erro de campo for mapeado. Vai para a rodada 2, só este ponto, com teste que o prove. |

## Sugestões do revisor de código (não entram na triagem)
- Duplicação do campo de formulário com a feature auth (candidata a Issue de manutenção para promover a `shared/`), mensagem de rede duplicada, `parsePrice` aceitando `0x10`/`1e3`, `catch` do `usePlans` descartando a lista no erro de refetch, teste de duplo clique, foco no primeiro campo inválido: não foram promovidas a apontamento. Ficam registradas como candidatas de refino; nenhuma entra na rodada 2, para não ampliar o escopo.
- O revisor de conformidade também registrou, como observação não bloqueante, o arredondamento silencioso de "19,999" para 20,00 e a aceitação de notação científica/hexadecimal no preço (mesmos pontos de `parsePrice`).
