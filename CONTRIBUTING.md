# Guia de Contribuição e Método de Trabalho (UTF-SDD)

Bem-vindo ao repositório! Este documento explica como trabalhamos aqui. Leia antes de iniciar sua primeira entrega e volte a ele sempre que tiver dúvidas sobre "como eu deveria estar fazendo isso".

## 🥇 A Regra de Ouro

Pedir código para uma Inteligência Artificial é fácil. O problema aparece semanas depois, quando ninguém lembra o porquê de uma regra existir e alterar o sistema vira um caos. Para resolver isso, adotamos o **UTF-SDD**, um **SDD por Portões** (*Gated Spec-Driven Development*): nada avança sem um portão de decisão humana registrada, e quem revisa nunca é quem escreveu.

A regra número um deste repositório é:

> **A IA escreve o código. Você continua responsável por cada decisão.**

Você é o Engenheiro e o Arquiteto; a IA é a sua equipe de execução.

**Quem assina o quê.** O **Pull Request é sempre seu** — o agente prepara os fatos, você
escreve a explicação e abre. Nos **commits**, a decisão é sempre sua, e a execução muda
de mão conforme o artefato: na Fase 0 e na aprovação da spec **você commita**, porque a
autoria precisa estar no `git log` com o seu nome; dentro do ciclo de implementação o
agente executa o commit, mas só depois do seu "pode commitar".

---

## 🌳 Fluxo Git e Proteção da Produção (GitHub Flow)

- **A branch `main` é sagrada:** Ela reflete a produção e possui bloqueio de commits diretos.
- **Trabalho:** Crie uma branch curta **a partir da `main`** para cada Issue (feature branch).
- **Integração:** Ao finalizar, abra um Pull Request contra a `main` com `Closes #<n>`. O Portão de Entendimento precisa passar antes do merge; a esteira de testes e lint chega com a Issue de CI (ID18) e, a partir dela, passa a ser exigida também.

---

## 🗺️ Onde as coisas vivem (Artefatos)

Nada é duplicado neste projeto. Informação repetida diverge.

| Artefato          | Onde fica               | O que responde                                                         |
| :---------------- | :---------------------- | :--------------------------------------------------------------------- |
| **Vitrine**       | `README.md` na raiz     | O que é o projeto e como rodar.                                        |
| **Produto**       | `docs/prd.md`           | O que o sistema faz (Glossário, Atores, Histórias).                    |
| **Arquitetura**   | `docs/architecture.md`  | Onde as coisas estão (estrutura, entidades, contratos).                |
| **Jornadas**      | `docs/user-flows.md`    | O caminho do usuário e onde ele desiste.                               |
| **Design**        | `docs/design-tokens.md` | Paleta, espaçamento e tipografia — para a IA não inventar um botão por tela. |
| **Ficha**         | `docs/checklist.md`     | As regras da disciplina, os IDs e as entregas — a régua dos workflows. |
| **Modelos**       | `docs/modelo-spec.md` e `docs/modelo-plan.md` | A forma do `spec.md` e do `plan.md`, comentada. Não são specs — são a régua. |
| **Especificação** | `specs/<issue>-<slug>/` | O `spec.md` (o que fazer), o `plan.md` (tarefas técnicas) e `reviews/` (pareceres e triagem). |
| **Leis da IA**    | `.agents/`              | `rules/utf-rules.md` (constituição, carregada via `CLAUDE.md`), `workflows/` (ciclos) e `agents/` (prompts dos subagentes). |

---

## 🔄 O Ciclo de Trabalho

Todo trabalho que altera o comportamento do sistema segue o ciclo UTF-SDD, orquestrado pelos agentes do repositório: `/utf-issue <n>` inicia (spec → plano), `/utf-task <n>` executa cada tarefa com tutor, implementador de contexto limpo e dois revisores distintos, e `/utf-issue <n>` rodado de novo fecha a Issue: docs, auditor final sobre o diff inteiro e PR.

- **O passo a passo operacional** (comandos e o que fazer em cada pausa) está no [Tutorial do Método](./docs/tutorial-sdd.md).
- **O porquê de cada regra** está no [Guia da Disciplina](./docs/guia-sdd.md).

O que é **norma inegociável** deste repositório são os portões humanos — quatro por história e um quinto no Pull Request. Nenhum agente passa por eles em seu lugar:

1. **🚪 Spec e plano:** só você aprova a spec, trocando `status: rascunho` → `status: aprovada` num commit seu, e dá o OK ao plano derivado dela.
2. **🚪 Explicação do tutor:** cada tarefa só é implementada depois do seu "pode implementar" — dúvida agora custa cinco minutos; depois do diff, custa uma rodada.
3. **🚪 Triagem:** só você aceita ou recusa apontamentos de revisão (recusa exige justificativa, registrada em `specs/<issue>-<slug>/reviews/tarefa-NN-decisoes-rN.md`).
4. **🚪 Commit:** revisores aprovarem não basta — o orquestrador apresenta o diff e os pareceres e só commita com o seu "pode commitar".
5. **🚪 Pull Request:** só você escreve a explicação, com as suas palavras, listando os apontamentos aceitos e recusados.

---

## 🛑 O Portão de Entendimento (Regras de Pull Request)

Se o Pull Request for a primeira vez que você olha o código, o método falhou. Por isso **todo PR** — de história ou de manutenção — passa por uma verificação automática antes de ser mesclado, e a proteção da `main` exige que ela passe:

- A descrição precisa conter a seção _"O que este PR faz e por quê"_ preenchida por você com pelo menos **250 caracteres** (sem contar espaços). Não cole o _diff_ nem a saída da IA; explique com suas palavras. A verificação está em `.github/workflows/portao-de-entendimento.yml`, e o guia (§9 e Apêndice B) explica cada linha.

**A etiqueta `manutencao` decide outra coisa:** se o PR precisava ou não de `spec.md`. Mudança puramente técnica (atualizar versão, refatorar, arrumar formatação) e correção de bug nascem como Issue direto no GitHub, sem `spec.md`, e o PR recebe a etiqueta `manutencao` — mas a explicação continua obrigatória. São duas perguntas independentes.

---

## ⚠️ Erros Comuns e Como Evitá-los

- **Inchar a Spec no meio do caminho:** Se descobrir um problema novo durante a implementação, não remende o plano em andamento. Pause, registre o problema e abra uma nova Issue focada apenas naquilo.
- **Fatiar na Horizontal:** "Criar tabela de usuários" não é uma história demonstrável. Fatie por valor: "Fazer login de usuário".
- **A Janela de Contexto Suja:** Se o agente travar, errar repetidamente ou defender ideias descartadas, descarte a sessão do chat. Comece uma nova entregando apenas o `spec.md` e o `plan.md` aprovados. O contexto limpo resolve 90% dos problemas.
- **Aceitar todos os apontamentos do revisor:** Revela que você não leu. Recusar com justificativa registrada vale mais do que aceitar tudo — e é o que a defesa presencial cobra.
