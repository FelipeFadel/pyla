---
description: Define o fluxo operacional obrigatório da IA. Exige a criação e aprovação do spec.md e plan.md antes de qualquer código. Garante a execução em micro-tarefas com TDD, revisão por agentes distintos, trava erros em 2 rodadas de revisão e prepara o Pull Request.
---

# Fluxo de Trabalho de Implementação (SOP)

Sempre que o usuário pedir para trabalhar em uma Issue (Feature), você atuará como o orquestrador do método SDD seguindo ESTA ORDEM rigorosa:

**Passo 0: Pré-condições**
- Acesso ao GitHub: MCP do GitHub disponível **ou** `gh` autenticado (`gh auth status`). Sem um dos dois, **PARE** — este fluxo lê Issues e prepara PR.
- A Issue existe no GitHub. Se as Issues das stories ainda não foram criadas, mande rodar `/utf-backlog` primeiro.
- **Retomada.** Se `specs/<NNN>-<slug>/` já existe, **não recomece**: descubra o estado e entre no passo certo — spec `rascunho` → pausa do Passo 1; `aprovada` sem `plan.md` → Passo 2; plano com tarefa pendente → Passo 3; todas feitas → Passo 4. É assim que `/utf-issue <n>` fecha a Issue depois da última tarefa.

**Passo 1: Entendimento e Brainstorming**
- Leia a Issue apontada e busque no `docs/prd.md` os critérios e o Glossário Ubíquo.
- Faça perguntas ao usuário de forma proativa. Questione sobre casos de borda, caminhos tristes (ex: falhas de rede, dados inválidos) e como validar os critérios de aceite.
- **Crie a branch da Issue antes de salvar qualquer arquivo.** A `main` é bloqueada, e o commit de aprovação do usuário precisa de um lugar para viver:

```bash
git switch main && git pull
git switch -c <numero-da-issue>-<slug>
```

- Após sanar as dúvidas, redija o documento e salve no caminho `specs/<NNN>-<slug>/spec.md` — número da Issue com três dígitos (`specs/027-pagamento-do-pedido/`); a branch não leva o zero (`27-pagamento-do-pedido`) — com este frontmatter e estas seções, nesta ordem:

```yaml
---
issue: 27
status: rascunho   # rascunho | aprovada
---
```

  **A estrutura é a de `docs/modelo-spec.md`** — copie-a e preencha; os comentários dela explicam cada seção e são apagados no caminho. Não invente seções novas nem pule as existentes.

  Se `docs/user-flows.md` tem jornada desta história, cada nó vermelho dela vira pelo menos um critério de aceite. Acrescente a linha desta spec em `specs/README.md`, com estado `rascunho` (os estados são `rascunho`, `aprovada`, `implementada` e `bloqueada`).

- Proponha o commit do rascunho (`spec: <slug> (#<n>) — rascunho`) e faça-o **só com o OK do usuário**.

- **PAUSA OBRIGATÓRIA:** Pare de gerar respostas e exija que o usuário leia e aprove o `spec.md`. Ofereça `/utf-tutor spec` para ele entender as consequências técnicas de cada decisão antes de aprovar. A aprovação é o **próprio usuário** trocar `status: rascunho` por `status: aprovada` e commitar essa linha, **na branch da Issue** — assim a aprovação fica no `git log`, com o nome dele. Você não altera esse campo em hipótese nenhuma.

**Passo 2: Planejamento**
- Com o `spec.md` aprovado, quebre o trabalho em tarefas curtas e encadeadas — cada uma é **um critério de aceite inteiro**, ponta a ponta, ou um passo técnico que sozinho não prova nada mas destrava o próximo. Se ao descrevê-la você usa "e" duas vezes, são duas tarefas.
- Cada tarefa deve prever a criação de testes primeiro (TDD).
- Formato do `plan.md`: o de `docs/modelo-plan.md` — checklist `- [ ] **Tarefa N — <título>**`, cada uma citando o critério de aceite que cobre e o teste que nasce primeiro. Tarefa feita vira `- [x]`: é essa marcação que o `/utf-task` sem número lê. A seção *Critérios sem tarefa* precisa terminar vazia.
- Se o plano passar de **10 tarefas**, pare: a história é grande demais. Proponha dividi-la em duas Issues antes de continuar.
- Salve o resultado no caminho `specs/<numero-da-issue>-<slug>/plan.md`.
- **PAUSA OBRIGATÓRIA:** Peça a aprovação do usuário para o plano.
- Aprovado, proponha o commit do plano (`plan: <slug> (#<n>)`) e faça-o com o OK do usuário. Spec e plano são os primeiros commits da branch, **antes de qualquer código** — é o `git log` que prova que a especificação veio primeiro.

**Passo 3: Execução (uma tarefa por vez)**
- Execute **uma tarefa por vez** através do fluxo `/utf-task` (`.agents/workflows/utf-task.md`), que despacha o subagente **implementador** com contexto limpo e, depois dele, dois revisores distintos e somente-leitura: **revisor-conformidade** (diff × critérios de aceite da `spec.md`) e **revisor-codigo** (diff × `docs/architecture.md`).
- **Você nunca revisa o código que você mesmo despachou.** Revisor é sempre outro agente, sem permissão de escrita. Auto-auditoria não conta como revisão: quem escreveu carrega os mesmos pontos cegos.
- Ao fim de cada tarefa, pare e devolva o controle ao usuário. Ele pede a próxima.

**Passo 4: Auditoria final e Pull Request**
- Terminadas todas as tarefas, atualize **primeiro** a documentação: o status da história no `docs/prd.md` (→ `Live`), os diagramas do `docs/architecture.md` que mudaram, e a linha da spec no `specs/README.md` (→ `implementada`). Proponha o commit e faça-o **só com o "pode commitar" do usuário** — o portão do commit vale aqui como em cada tarefa.
- Despache então o subagente **auditor-final**, que compara o diff **inteiro** da branch contra o `spec.md` original — nunca contra o `plan.md` — e confere a documentação que acabou de ser atualizada. Se o veredito for NÃO PRONTO, cada pendência vira tarefa nova no `plan.md` (com o OK do usuário) e passa pelo `/utf-task`; depois o auditor roda de novo.
- Com PRONTO PARA PR, sugira `/utf-tutor prova` — o simulado interativo sobre o diff inteiro, que é o ensaio da defesa presencial.
- Lembre o usuário de abrir o Pull Request com `Closes #<n>`.
- A seção **"O que este PR faz e por quê"** é escrita **pelo usuário, com as palavras dele**. Ofereça os fatos do diff; não ofereça o texto pronto.
- No corpo do PR devem constar os apontamentos **aceitos e recusados**, com o motivo de cada recusa. A fonte é `specs/<issue>-<slug>/reviews/`: os pareceres (`tarefa-NN-<tipo>-r<N>.md`) e as decisões de triagem (`tarefa-NN-decisoes-r<N>.md`).
