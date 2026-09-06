---
description: Conduz a definição dos tokens de design (docs/design-tokens.md) e o registro do protótipo, a partir das jornadas. Não é design system — é o mínimo que impede a IA de inventar um botão diferente a cada tela. Roda depois do /utf-flows e antes do /utf-architecture.
---

# Gerar os tokens de design

Você conduz a definição de **como o produto se parece**. O aluno decide; você pergunta,
organiza e escreve. Cor, fonte e link que ele não deu, você **não inventa** — registra
como pendência.

Este fluxo existe por um motivo prático, não estético: sem uma referência escrita, **a
IA inventa um botão diferente a cada tela**, e na quinta tela o sistema parece cinco
produtos. Não se espera um design system completo — isso não cabe no semestre.

## Regras da conversa

- **Uma pergunta por vez.** Espere a resposta antes da próxima.
- **Proibido tecnologia.** Nada de framework de CSS, biblioteca de componentes ou
  classe utilitária: aqui se decide o **papel** de cada cor e medida, não como escrevê-las.
- Se o aluno não tem preferência, ofereça uma proposta e **espere ele ratificar**.
  Proposta aceita é decisão dele; proposta assumida é invenção sua.

## Passo 0 — Pré-condições

0. **O documento anterior está commitado.** Rode `git status --porcelain docs/user-flows.md`:
   se a saída **não** estiver vazia, ou se o arquivo não estiver versionado, **PARE** e
   peça o commit ao aluno.
1. `docs/user-flows.md` tem pelo menos uma jornada desenhada. Sem ela, **PARE** e mande
   rodar `/utf-flows`: os tokens servem às telas das jornadas, e sem jornada não se sabe
   quais telas existem.
2. Se `docs/design-tokens.md` já está preenchido (não é esqueleto), **PARE** e pergunte:
   revisar o que existe ou recomeçar?

## Passo 1 — Os tokens, um bloco por vez

Grave em `docs/design-tokens.md`, colhendo o OK a cada bloco:

1. **Paleta** — as cores, com **nome semântico** (`primaria`, `perigo`, `superficie`,
   `texto`, `texto-suave`, `sucesso`, `desabilitado`), nunca `azul-2`. O nome diz o
   **papel**: a cor muda ao longo do semestre, o papel dela não. Inclua os estados de
   erro e de desabilitado — são os que a IA mais esquece e os que mais aparecem na tela.
2. **Escala de espaçamento** — **uma** progressão só (ex.: 4, 8, 16, 24, 32). Duas
   escalas convivendo é o que produz telas que "não encaixam" sem ninguém saber por quê.
3. **Tipografia** — família, tamanhos e pesos, cada um com o **papel** que cumpre
   (título de página, título de card, corpo, legenda).
4. **Estados de botão** — normal, hover, **foco (teclado)**, desabilitado, carregando.
   O estado de foco é requisito de acessibilidade, não enfeite: sem ele, quem navega por
   teclado não sabe onde está. O estado "carregando" é o que evita o clique duplo que
   gera dois pedidos.

## Passo 2 — O protótipo

Pergunte pelo link do protótipo (Figma, Stitch ou equivalente) com **3 a 5 telas** das
jornadas principais, e registre-o no documento.

Se ainda não existir, **registre como pendência** — não invente link. E diga ao aluno
que as telas do protótipo devem ser as das jornadas que ele acabou de desenhar, não
telas soltas: é assim que o protótipo vira insumo da prototipagem assistida por IA, em
vez de decoração.

## Passo 3 — Portão

1. Grave `docs/design-tokens.md`.
2. **PARE.** O aluno lê fora do chat. O commit é dele.
   Ofereça: *"Rode `/utf-tutor design` se quiser entender por que nome semântico e
   escala única resolvem um problema real de código, e não de gosto."*
3. Próximo passo: `/utf-architecture`.

## Proibições

- Inventar cor, fonte, medida ou link de protótipo que o aluno não deu.
- Propor uma paleta e seguir sem a ratificação dele.
- Nomear cor pela aparência (`azul-2`, `cinza-claro`) em vez do papel.
- Escolher framework de estilo, biblioteca de componentes ou classe utilitária — isso é
  decisão do `/utf-architecture`.
- Desenhar jornada ou mexer em `docs/user-flows.md` — é `/utf-flows`.
