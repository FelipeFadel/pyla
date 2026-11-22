# Decisões — Tarefa 5, rodada 1

> Triagem feita pelo agente orquestrador, por delegação expressa do usuário ("roda uma de cada vez tomando as decisões com base no que recomenda"). O usuário pode rever qualquer decisão abaixo antes do PR.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A checagem de corpo vazio (`{}`) está no service, montando à mão o 400, e não na validação de entrada (`architecture.md` §2.1, ID7: "malformada é recusada antes do service") | código | aceito | A regra da arquitetura é explícita e a recomendação do revisor (validador de classe no `UpdatePlanDto`, ou pipe) é de baixo custo e mantém o formato de erro do `ValidationPipe`. Vai para a rodada 2, só este ponto. |

## Sugestões do revisor de código (não entram na triagem)
- `translateWriteError` com retorno `unknown` e sem guard para `error` nulo, constantes P2002/P2025 repetidas, regras compartilhadas em arquivo neutro, helper de sessão nos e2e, caso de edição sem alteração real: não foram promovidas a apontamento. Ficam como candidatas de refino; o guard de `null` pode entrar na rodada 2 se o implementador já estiver mexendo no helper, sem aumentar o escopo.
