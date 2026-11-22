# Decisões — Tarefa 1, rodada 1

> Triagem feita pelo agente orquestrador, por delegação expressa do usuário ("NÃO PRECISA DA MINHA APROVAÇÃO PARA AS 10 TAREFAS, roda uma de cada vez tomando as decisões com base no que recomenda"). O usuário pode rever qualquer decisão abaixo antes do PR.

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A coluna `User.role` contradiz a frase do `architecture.md` §5.1 ("Não existe coluna de papel em `User`") | código | recusado (sem mudança de código) | O próprio revisor reconhece que o código está certo: a spec aprovada (CA13 a CA17) exige o papel ADMIN, e a frase do documento foi escrita para o premium (RN19), não para o papel de administração. O que está desatualizado é o documento. A atualização do `architecture.md` (`User.role`, `Plan`, `Subscription.planId`, ER) já está prevista no plano, em *Decisões técnicas*, e é feita no fechamento (Passo 4 do `/utf-issue`). |

## Sugestões do revisor de código (não entram na triagem)
- `migration_lock.toml` com dois comentários de cabeçalho gerados pelo Prisma: não foi promovida a apontamento; fica para o usuário reverter ou aceitar ao montar o commit.
- Extrair um tipo `AuthenticatedRequest` e usar `@ApiProperty({ enum: Role })`: candidatos para a Tarefa 2, quando o segundo consumidor de `req.user` existir.
- Fragilidade da suíte e2e em banco compartilhado: candidata a Issue de manutenção.

## Observação de processo
A instabilidade do e2e relatada nos dois pareceres veio de os dois revisores rodarem a suíte ao mesmo tempo no mesmo banco. Rodando sozinha, depois dos pareceres: 8 arquivos e 52 testes passando.
