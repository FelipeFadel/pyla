# Decisões — Tarefa 3, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Os arquivos e2e rodam em paralelo contra a mesma tabela `User` e o `deleteMany()` de um apaga as linhas do outro; o e2e fica intermitente e não prova CA1, CA3 e CA4 de forma confiável. Saída escolhida: rodar os e2e em série (`fileParallelism: false` no `vitest.config.e2e.ts`). | conformidade e código | aceito | |

Observação do revisor de conformidade (sem bloqueio): limite de senha em 72 **bytes** UTF-8 em vez de 72 caracteres. O usuário confirmou a decisão; nenhuma mudança.

Sugestões do revisor de código (r1) não promovidas a apontamento: registrar `Secure`/`SameSite` para a Atividade 15, helper das opções do cookie só quando o login precisar, banco de teste separado do de desenvolvimento, ordem do `bcrypt` antes da checagem de duplicidade (CA2).
