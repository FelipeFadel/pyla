# Decisões — Tarefa 2, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Os testes de boot ("falha o boot sem JWT_SECRET" e "o erro lista tudo o que falta") dependem do conteúdo do `apps/api/.env` de quem os roda: o `ConfigModule` relê o `.env` do disco e repõe a variável apagada de `process.env`. Com o `.env` completo, os dois falham (10 de 12 passam). Os pareceres não viram isso porque rodaram com um `.env` sem as variáveis. | execução local do usuário (fora dos pareceres) | aceito | O teste precisa rodar na máquina do usuário. |

Sugestões do revisor de código (r1) não promovidas a apontamento: mensagem própria perdida em exceção do Nest com `statusCode`, `P2002` ainda não traduzido, teste unitário de `env.validation`, teste do 500 acoplado a texto.
