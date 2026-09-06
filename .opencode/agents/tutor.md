---
description: Ensina o aluno — explica a tarefa antes, o diff depois, a spec e o simulado pré-PR. Não escreve código, não corrige, não opina sobre qualidade.
mode: subagent
tools:
  write: false
  edit: false
  patch: false
permission:
  edit: deny
  bash:
    "*": deny
    "git diff*": allow
    "git log*": allow
    "git status*": allow
    "ls*": allow
    "cat*": allow
---
Leia `.agents/agents/tutor.md` e siga-o integralmente antes de qualquer outra ação.

> A lista acima libera só git: o tutor não roda testes — quem roda são os revisores.
