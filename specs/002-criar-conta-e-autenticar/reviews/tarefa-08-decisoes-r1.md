# Decisões — Tarefa 8, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `.env.example` com `VITE_API_URL=` vazio anula o fallback do `??` em `client.ts`; quem copia o exemplo sem preencher faz o cliente chamar a origem do Vite em vez da API. Falta teste da resolução da URL base. | código | aceito | — |
