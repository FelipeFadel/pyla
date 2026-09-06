---
description: Leva as user stories do prd.md aprovado para o GitHub — uma Issue por story Ready, com a descrição apontando só para o PRD, e o Kanban no GitHub Projects. Roda depois do /utf-prd, com o aceite do professor. Exige MCP do GitHub ou gh autenticado.
---

# Gerar o backlog no GitHub

Você leva o backlog do papel para o quadro. A fonte da verdade **continua sendo
o `docs/prd.md`** — a Issue é só o cartão que aponta para ela. Issue com regra
de negócio copiada é a receita da divergência: alguém atualiza o PRD, a Issue
fica velha, e a IA lê a versão errada.

## Passo 0 — Pré-condições (PARE se qualquer uma falhar)

1. Acesso ao GitHub: MCP do GitHub disponível **ou** `gh` autenticado
   (`gh auth status`). Sem um dos dois, **PARE** e oriente: instalar o `gh`,
   `gh auth login`, escopos `repo`, `workflow` e `project`.
2. `docs/prd.md` preenchido e **commitado pelo aluno**, com o tema já
   **aceito pelo professor**.
3. Existe ao menos uma story com `Status: Ready`. Story `Draft` não vira
   Issue — regra indefinida não entra na fila de implementação.

## Passo 1 — Conferir o que já existe

Liste as Issues abertas do repositório. Se alguma story já tem Issue, **não
duplique** — relate e pule. Este fluxo pode rodar de novo a cada leva de
stories promovidas a `Ready`.

## Passo 2 — Uma Issue por story `Ready`

Para cada story `Ready` ainda sem Issue, crie a Issue com:

- **Título:** `USnn — <título da story>`
- **Descrição:** APENAS o link para a story no `docs/prd.md` (ex.:
  `docs/prd.md` seção US03) e o link do critério da ficha, se houver.
  **NUNCA copie regras de negócio ou critérios de aceite para a Issue** —
  constituição, regra 6.
- **Labels:** crie/aplique `story` e a prioridade (`must-have`, `should-have`,
  `could-have`), refletindo o MoSCoW do PRD.

Apresente a lista do que vai criar **antes** de criar, e espere o OK do
usuário — Issue criada aparece para a turma e para o professor.

## Passo 3 — O Kanban (GitHub Projects)

A criação do board é **manual** (a interface do Projects muda rápido e o
aluno precisa conhecê-la): oriente-o a criar um Project no repositório com as
colunas `Backlog`, `Ready`, `In Progress`, `Blocked`, `Done`, e a adicionar as
Issues recém-criadas — `Must Have` primeiro no topo do `Backlog`. (`Blocked` é
onde uma história espera outra; o guia explica quando isso acontece.)

Se o MCP/`gh` da sessão conseguir adicionar as Issues ao Project, ofereça
fazer isso; se não conseguir, não é erro — siga com a orientação manual.

## Passo 4 — Entrega

Relate: Issues criadas (número e título), stories puladas (e por quê), e o
estado do Kanban. Lembre o fluxo: se `/utf-flows`, `/utf-architecture` e `/utf-setup` ainda
não rodaram, eles vêm antes; então a implementação de cada Issue começa por
`/utf-issue <n>`, **uma por vez**, começando pelos `Must Have`.

## Proibições

- Copiar regra de negócio, critério de aceite ou texto da story para a Issue.
- Criar Issue de story `Draft`, ou de coisa que não é story (bug e task de
  manutenção nascem direto no GitHub, sem passar por aqui).
- Criar Issues sem o OK do usuário sobre a lista.
- Marcar story como `Ready` para ela poder virar Issue — a promoção é do aluno.
