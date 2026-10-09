# 🎨 Tokens de Design

**Projeto:** Pyla — controle de gastos de mercado com comparação colaborativa de preços
**Versão:** 1.0.0 · revisão via `/utf-design` contra o protótipo — 4 blocos de tokens e protótipo com link público registrados
**Última atualização:** 2026-10-08

> 🤖 **Este documento existe para a IA parar de inventar um botão diferente a cada
> tela.** Não é um design system — é o mínimo que dá à prototipagem assistida algo a
> que obedecer.
>
> ✍️ **Não preencha na mão:** rode `/utf-design` (depois do `/utf-flows`).

---

## Paleta

Nome semântico, nunca `azul-2` — a cor muda, o papel dela não.

**Origem:** paleta de hortifruti trazida pelo aluno (caixas de feira), aprovada em
2026-09-20. Revisada em 2026-10-08 contra o protótipo do Stitch: **o protótipo passou a
mandar**. Os valores abaixo foram lidos do código das telas (via MCP); o papel de cada
um foi decidido pelo aluno.

| Token | Valor | Onde se usa |
| --- | --- | --- |
| `primaria` | `#293379` | botão principal ("Confirmar Compra", "+ Nova Compra", "Assinar"), mês selecionado |
| `primaria-forte` | `#101b63` | título de página; hover do botão primário |
| `fundo` | `#f6f6fa` | fundo da página |
| `superficie` | `#ffffff` | card e painel |
| `superficie-suave` | `#f5f2ff` | bloco dentro de card: mês não selecionado, caixas internas, campo de seleção |
| `superficie-media` | `#eeecff` | botão secundário com fundo, abas de estado da Assinatura, hover de item de menu |
| `texto` | `#191a2e` | texto padrão |
| `texto-suave` | `#454650` | legenda, apoio, "Sem loja informada" |
| `perigo` | `#ba1a1a` | erro de validação, "Sair", cancelar assinatura |
| `perigo-fundo` | `#ffdad6` | caixa de erro; hover de ação destrutiva |
| `sucesso` | `#4f6618` | ícone de confirmação, valor de desconto, barras do resumo |
| `sucesso-fundo` | `#ceea8d` | selo positivo ("Cancele quando quiser", desconto no item) |
| `atencao` | `#ffba2c` | ícone e borda do selo premium |
| `atencao-fundo` | `#ffdeaa` | selo "Plano Gratuito · Assinar", selo Premium, faixa de convite |
| `foco` | `#e5a300` | anel de foco de teclado, em todas as telas |
| `desabilitado` | `#c3c4d2` | controle inativo (nunca carrega informação sozinho) |

**Procedência das cores:** as quatro cores-base da caixa de feira continuam sendo a
semente do tema no Stitch — `primaria` ← blue crate (`#293379`), `sucesso` ← green beans
(`#607829`), `foco` ← citrus yellow (`#e5a300`) e o quase-preto `#16172b` do texto. Os
demais tons foram derivados pelo Stitch a partir delas.

**Decisões registradas:**

- **O protótipo manda na paleta (2026-10-08).** O Stitch não aplica os valores-base
  literalmente: ele gera uma família de tons a partir deles, e é essa família que as
  telas usam. Registrar os valores de 20/09 deixaria o documento descrevendo um produto
  que não existe; o documento passou a registrar o que as telas de fato usam.
- **`foco` virou token próprio.** Antes, `atencao` acumulava selo premium e anel de foco.
  O protótipo separou os dois: o anel segue no cítrico `#e5a300` (o que mais contrasta
  com `primaria`), e os selos usam os amarelos claros. Um papel por token.
- **Fundos claros ganharam token** (`perigo-fundo`, `sucesso-fundo`, `atencao-fundo`).
  Sem eles, cada tela nova inventaria um tom diferente atrás de erro, desconto e convite.
- **Só dois lilases de superfície.** O Stitch usa um terceiro (`#e7e6ff`, 14 usos em
  chips e um botão), quase indistinguível de `superficie-media`. Não ganha token: onde
  aparece, deve ser trocado por `superficie-media`.
- **Texto sobre os fundos claros fica sem token próprio.** O Stitch usa tons específicos
  (`#93000a`, `#536a1d`, `#271900`); o documento fica enxuto e eles não são registrados.
- **Laranja e verde-alface da referência continuam de fora.** Cor sem papel definido é
  cor que a IA aplica sem critério.
- **`desabilitado` nunca é o único sinal de um estado.** O PRD exige que mensagens de
  erro não sejam transmitidas só por cor; o mesmo vale para controle inativo.

---

## Escala de espaçamento

Uma progressão só, usada em tudo. Base 4, dobrando — aprovada em 2026-09-20; unidade e
nomes revisados em 2026-10-08 para coincidir com o protótipo.

| Token | Valor | Equivale a | Onde se usa |
| --- | --- | --- | --- |
| `space-xxs` | `0.25rem` | 4px | rótulo e campo; respiro dentro de uma linha |
| `space-xs` | `0.5rem` | 8px | ícone e texto; interior de badge; gap entre linhas de lista |
| `space-sm` | `1rem` | 16px | padding de card; distância entre campos; margem lateral da tela no celular |
| `space-md` | `1.5rem` | 24px | padding de painel; gap entre blocos |
| `space-lg` | `2rem` | 32px | entre seções da mesma tela; margem lateral no desktop |
| `space-xl` | `3rem` | 48px | respiro do topo da página |

A coluna "Equivale a" é só referência, com a fonte padrão do navegador (1rem = 16px).

**Decisões registradas:**

- **Em rem, não em px (2026-10-08).** rem acompanha o tamanho de texto escolhido no
  navegador: quem aumenta a fonte por baixa visão vê os espaços crescerem junto, em vez
  de a letra crescer e o layout apertar. É também a unidade do código gerado pelo Stitch,
  então documento e código falam a mesma língua.
- **Nomes do Stitch (`space-xxs` … `space-xl`), não os de 20/09 (`xs` … `2xl`).** Os
  valores eram os mesmos, mas os nomes estavam deslocados um degrau (o `xs` antigo era
  4px; o `space-xs` do protótipo é 8px). Dois nomes para o mesmo valor é o tipo de
  confusão que faz alguém aplicar o degrau errado; ficou o nome que já está no código.
- **O protótipo ainda tem valores fora da escala.** Cerca de 110 usos de 2px, 6px, 10px e
  12px no código das telas. Não viram token: ao levar uma tela para o código, cada um é
  arredondado para o degrau mais próximo da tabela.

- **Base 4, dobrando, e não uma escala mais apertada (2·4·8·12·16).** Em degraus de 12 e
  16 a diferença é pequena demais para ser óbvia: na hora de aplicar, cada tela escolhe
  um dos dois no chute, e é daí que sai a tela que "não encaixa" sem ninguém saber por
  quê. Cada degrau daqui é visivelmente distinto do anterior.
- **Nem uma escala arejada (8·16·32·48·64).** O registro de compra da US02 é o cadastro
  mais longo do produto, uma lista de itens que cresce; com esse respiro ela vira
  rolagem infinita no celular.
- **Nenhum valor fora desta tabela.** Não existe "14px porque ficou melhor aqui": valor
  fora da escala é o começo de uma segunda escala convivendo com a primeira.

## Tipografia

Proposta "Caixa de feira" — aprovada em 2026-09-20; mantida na revisão de 2026-10-08,
mesmo divergindo do protótipo (ver decisões).

**Famílias:** `Saira Stencil One` (display) e `Saira` (corpo), ambas do Google Fonts.
Toda declaração leva pilha de fallback real: `"Saira Stencil One", "Trebuchet MS",
sans-serif` e `"Saira", system-ui, sans-serif`.

| Token | Família · tamanho · peso | Papel |
| --- | --- | --- |
| `titulo-pagina` | Saira Stencil One · 32px · 400 | título da tela (Resumo de setembro) |
| `titulo-card` | Saira · 18px · 700 | título de card e de seção interna |
| `corpo` | Saira · 16px · 400 | texto padrão, campo de formulário, nome de produto |
| `legenda` | Saira · 13px · 400 · `texto-suave` | apoio, data e loja do último registro |
| `numero` | Saira · 26px · 600 · `tabular-nums` | valor em R$, total do mês, custo por unidade |

**Decisões registradas:**

- **Origem:** o letreiro pintado no engradado azul da imagem de referência é estêncil —
  a letra vazada com que se marca caixa de feira. A Saira Stencil One é a tradução
  direta dela. A tipografia sai do assunto do produto, não é aplicada por cima dele.
- **O estêncil fica só em `titulo-pagina` e no total do mês.** Letra vazada perde a
  contraforma em corpo pequeno: em 13px de legenda ela fica ilegível. Todo o resto usa a
  Saira normal — mesma família, mesmo desenho de base, sem o vazado.
- **O documento manda na tipografia, não o protótipo (2026-10-08).** O Stitch não oferece
  a Saira e trocou por Chivo (títulos, números) + Work Sans (corpo, legenda) como
  aproximação. Os tamanhos e pesos do protótipo batem com esta tabela; só a família
  difere, e o título lá sai em peso 800 sem estêncil. **O protótipo não é referência de
  fonte:** ao levar uma tela para o código, vale a Saira desta tabela. Diferente da
  paleta, aqui a troca custaria o motivo da escolha — o estêncil é o que liga a
  interface ao assunto do produto.
- **Descartada a opção Fraunces + Inter.** A Inter é a face mais associada a interface
  gerada por IA; num projeto cujo tema é usar IA com critério, ela trabalha contra a
  defesa. A serifa também briga com o clima de hortifruti da paleta.
- **Todo valor monetário usa `font-variant-numeric: tabular-nums`.** Sem isso a coluna
  de R$ serrilha, porque cada dígito tem largura própria — num app que empilha
  R$ 412,90 sobre R$ 96,20, o alinhamento na vírgula é requisito de leitura, não
  estética.
- **Corpo em 16px, não menos.** É o mínimo confortável para o formulário longo da US02
  em tela de celular.

## Estados de botão

Aprovados em 2026-09-20. Valem para todas as variantes (primário, secundário,
destrutivo) — o que muda entre elas é o fundo, não a regra de cada estado.

| Estado | Aparência |
| --- | --- |
| normal | fundo `primaria` `#293379`, texto `#ffffff`, raio 4px, padding `8px 20px`, Saira 15px 600 |
| hover | fundo escurece para `primaria-forte` `#101b63`, transição de 120ms |
| foco (teclado) | anel de `foco` `#e5a300`, 3px, deslocado 2px, via `:focus-visible` |
| desabilitado | fundo `desabilitado` `#c3c4d2`, texto `#62647d`, `cursor: not-allowed` |
| carregando | mantém `primaria`, spinner à esquerda, rótulo vira "Processando…", botão inerte |

**Variantes:** secundário usa fundo `superficie-media` `#eeecff` e texto `primaria` —
não disputa atenção com o primário (segue o protótipo, revisado em 2026-10-08).
Destrutivo usa fundo `perigo` `#ba1a1a` com texto branco (hover `#8f1211`) — segue o
documento, não o protótipo, que o desenhou só com texto vermelho.

**Decisões registradas:**

- **O anel de foco é `foco` (o cítrico), não `primaria`.** Um anel azul em volta de um botão azul
  não se vê. O cítrico é a única cor da paleta que contrasta com a primária em fundo
  claro e escuro. O foco visível é exigência do PRD (acessibilidade mínima do frontend),
  não enfeite: sem ele, quem navega por teclado não sabe onde está.
- **A regra de foco não muda entre variantes.** O anel é sempre cítrico, inclusive no
  botão destrutivo — anel que muda de cor conforme o botão vira ruído e deixa de ser
  reconhecível como "onde estou".
- **`:focus-visible`, não `:focus`.** Assim o anel aparece para quem navega por teclado
  e não a cada clique de mouse.
- **O estado carregando protege a RN17.** Sem ele, dois cliques rápidos em "Assinar
  premium" geram dois pedidos no gateway — a regra de "não criar segundo pedido com
  assinatura vigente" cai por um problema de interface, antes de o backend ter chance de
  defendê-la. O botão fica inerte enquanto a requisição corre.
- **A animação do spinner respeita `prefers-reduced-motion`.** Quem desativou animação no
  sistema vê o indicador parado, não a rotação.

## Protótipo

**Link:** https://stitch.withgoogle.com/preview/14093580883373874346?node-id=494ddf8c28484334bdcaefcc21961c93
(Stitch, projeto "Pyla Grocery Tracker") — link de visualização do protótipo, registrado
pelo aluno em 2026-10-08, substituindo o rascunho de 2026-09-20. Conferido em janela
anônima: abre sem login.

**Telas do protótipo** (as das jornadas do `user-flows.md`, não telas soltas — é isso que
faz o protótipo virar insumo da prototipagem assistida em vez de decoração):

| # | Tela | Jornada / Story |
| --- | --- | --- |
| 1 | Login e Criar Conta | US01 |
| 2 | Registrar Compra (item a item, com erro de validação e desconto de caixa) | Jornada 2 · US02 |
| 3 | Resumo do Mês (por categoria e por loja, "Sem loja informada", meses anteriores como premium) | US03 |
| 4 | Histórico de Preço (com o limite do plano gratuito) | US05 |
| 5 | Planos e Assinatura Premium (oferta, processando, aguardando, recusado, ativo) | Jornada 1 · US06, US07, US12 |

**Fora do protótipo, por decisão do aluno (2026-10-08):** a calculadora de custo por
unidade (US04) e a edição/exclusão de compras (US14) não têm tela. São histórias
`Must Have`; ficam sem referência visual.
