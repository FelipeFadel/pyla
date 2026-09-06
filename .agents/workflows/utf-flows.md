---
description: Conduz o desenho das jornadas de usuário (docs/user-flows.md) a partir do prd.md. Obriga pelo menos uma jornada com ponto de desistência declarado. Roda depois do /utf-prd e antes do /utf-design.
---

# Gerar as jornadas de usuário

Você conduz o desenho do **caminho que a pessoa percorre na tela** — e, principalmente,
dos pontos onde ela trava, espera ou desiste. O aluno decide; você pergunta, desenha e
escreve.

Este fluxo existe porque **o caminho feliz é óbvio e os caminhos ruins não são**. Teste
automatizado não cobre esse buraco: o aluno escreve teste para o que imaginou, e o
problema é justamente o que ele não imaginou. A jornada é o único artefato da Fase 0
que força o "e se der errado" a aparecer **antes** de virar spec.

Ele roda **antes do `/utf-architecture`** de propósito: um nó vermelho quase sempre
revela um estado que faltava (*"o pedido fica AGUARDANDO para sempre?"*), e estado é
matéria do `architecture.md`. Desenhar depois é descobrir o estado com o documento já
fechado.

## Regras da conversa

- **Uma pergunta por vez.** Espere a resposta antes da próxima.
- **Proibido tecnologia.** Nada de endpoint, tabela ou componente: jornada é o que a
  pessoa vive, não como o sistema atende.
- Uma jornada bem feita vale mais que três superficiais. **Não produza volume.**

## Passo 0 — Pré-condições

0. **O documento anterior está commitado.** Rode `git status --porcelain docs/prd.md`:
   se a saída **não** estiver vazia, ou se o arquivo não estiver versionado, **PARE** e
   peça o commit ao aluno. Não é burocracia: cada documento da Fase 0 é decisão dele, e
   o commit é o que põe o nome dele nessa decisão. Seguir sem commitar empilha quatro
   documentos num commit só, no fim, e a autoria some.

1. `docs/prd.md` preenchido, com stories e critérios de aceite. Sem ele, **PARE** e
   mande rodar `/utf-prd` — jornada sem história é desenho decorativo.
2. Se `docs/user-flows.md` já tem jornada real (não é esqueleto), **PARE** e pergunte:
   acrescentar uma nova ou revisar a existente?

## Passo 1 — Escolher a história que merece jornada

Nem todo fluxo precisa de diagrama: um CRUD de listagem não precisa de nenhum.
Percorra as stories do `docs/prd.md` e marque quais batem em cada um dos quatro
critérios:

| # | Critério | Exemplo |
| --- | --- | --- |
| 1 | **Sai do site e volta** | checkout, login social, confirmação por e-mail |
| 2 | **Depende do tempo** | algo pode demorar, expirar ou chegar fora de ordem |
| 3 | **Depende de outra pessoa agir** | uma aprovação, uma moderação, um parceiro aceitar |
| 4 | **Pode ser abandonado no meio** | formulário longo, cadastro em etapas |

Apresente a tabela ao aluno com as marcações e **peça que ele escolha**. Quanto mais
critérios uma história marca, mais ela merece o desenho — pagamento marca os quatro, e
é por isso que é o exemplo canônico.

**Pelo menos uma jornada é obrigatória.** Se nenhuma story marcar critério nenhum,
não invente: desenhe a mais crítica do projeto e registre, no documento, que ela não
marca os quatro — isso é informação honesta, não falha.

## Passo 2 — Desenhar

Três convenções, e só três:

- **Losango** — decisão do sistema (validação, guard, verificação de estado)
- **Retângulo com `«pessoa»`** — ação de quem está na tela
- **Nó vermelho** — onde a pessoa some

Mermaid `flowchart TD`, versionado no repositório. Diagrama em imagem colada
desatualiza em silêncio; o do repo muda no mesmo commit do comportamento.

```mermaid
flowchart TD
    A(["Escolheu o produto"]) --> B{"Está logado?"}
    B -->|"não"| C["/login"] --> D
    B -->|"sim"| D["«pessoa» confirma o pedido"]
    D --> E["API cria o Pedido<br/>status AGUARDANDO"]
    E --> F(["Checkout do gateway<br/>fora do site"])
    F --> G{"O que aconteceu?"}
    G -->|"pagou"| H["Volta para /pagamento/sucesso"]
    G -->|"fechou a aba"| X1[["Some — e o pedido fica<br/>AGUARDANDO para sempre?"]]
    H --> I{"Status real do pedido"}
    I -->|"webhook confirmou"| J(["PAGO"])
    I -->|"ainda não chegou"| K["«pessoa» vê 'processando'<br/>e acompanha no painel"]

    style X1 fill:#ffe0e0,stroke:#c62828
```

**Toda jornada precisa de pelo menos um nó vermelho.** Jornada sem ponto de
desistência é caminho feliz redesenhado — se você não achou nenhum, você não procurou.
Pergunte ao aluno, nesta ordem: o que acontece se ele fechar a aba aqui? se a conexão
cair? se a sessão expirar no meio? se a resposta do outro sistema nunca chegar?

## Passo 3 — O parágrafo que vale a nota

Abaixo de cada diagrama, **um parágrafo** dizendo o que foi decidido a respeito do nó
vermelho. É esse parágrafo que transforma o desenho em decisão de projeto, e é ele que
o professor vai pedir para o aluno explicar na defesa.

O texto é **do aluno**. Você pergunta *"e aí, o que o sistema faz nesse caso?"* e
organiza a resposta dele. Se ele não souber, isso não vira invenção sua: vira uma linha
em **Dúvidas em aberto**, e o `/utf-architecture` a resolve.

## Passo 4 — Portão

1. Grave `docs/user-flows.md`.
2. **PARE.** O aluno lê fora do chat. O commit é dele.
   Ofereça: *"Rode `/utf-flows` de novo se quiser outra jornada, ou `/utf-tutor flows` se quiser entender por que o nó vermelho muda o sistema."*
3. Próximo passo: `/utf-design`, que define os tokens visuais das telas destas jornadas.
   Depois dele vem o `/utf-architecture`, que lê as jornadas para encontrar os estados e
   os pontos de decisão que o `architecture.md` precisa declarar.

## Proibições

- Desenhar jornada de story que não existe no `docs/prd.md`.
- Entregar diagrama **sem** nó vermelho, ou nó vermelho **sem** o parágrafo do Passo 3.
- Escrever o parágrafo de decisão no lugar do aluno.
- Falar de endpoint, tabela, componente ou biblioteca — é `/utf-architecture`.
- Definir cor, fonte ou link de protótipo — é `/utf-design`.
