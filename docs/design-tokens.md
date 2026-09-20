# 🎨 Tokens de Design

**Projeto:** Pyla — controle de gastos de mercado com comparação colaborativa de preços
**Versão:** 0.4.0 · em construção via `/utf-design` — 4 blocos de tokens aprovados; protótipo pendente
**Última atualização:** 2026-09-20

> 🤖 **Este documento existe para a IA parar de inventar um botão diferente a cada
> tela.** Não é um design system — é o mínimo que dá à prototipagem assistida algo a
> que obedecer.
>
> ✍️ **Não preencha na mão:** rode `/utf-design` (depois do `/utf-flows`).

---

## Paleta

Nome semântico, nunca `azul-2` — a cor muda, o papel dela não.

**Origem:** paleta de hortifruti trazida pelo aluno (caixas de feira), aprovada em
2026-09-20. Os nomes originais da referência ficam registrados como procedência, mas
não são os tokens: o código usa o papel.

| Token | Valor | Onde se usa |
| --- | --- | --- |
| `primaria` | `#293379` | ação principal: confirmar compra, assinar premium, salvar |
| `superficie` | `#ffffff` | fundo de card e painel (fundo da página: `#f6f6fa`) |
| `texto` | `#16172b` | texto padrão — quase preto puxado para o azul da primária |
| `texto-suave` | `#5b5d75` | legenda, apoio, "Sem loja informada" |
| `perigo` | `#b81817` | erro de validação, excluir compra, pagamento recusado |
| `sucesso` | `#607829` | compra confirmada, pagamento aprovado, valor de desconto |
| `desabilitado` | `#c3c4d2` | controle inativo (nunca carrega informação sozinho) |
| `atencao` | `#e5a300` | selo premium, convite para assinar, foco de teclado |

**Procedência das cores:** `primaria` ← blue crate · `perigo` ← tomatoe red ·
`sucesso` ← green beans · `atencao` ← citrus yellow.

**Decisões registradas:**

- **Laranja e verde-alface da referência ficaram de fora.** Seis papéis cobrem as telas
  das jornadas do `user-flows.md`. Cor sem papel definido é cor que a IA aplica sem
  critério — exatamente o problema que este documento existe para evitar.
- **`atencao` acumula dois papéis:** selo/convite premium e anel de foco de teclado. É a
  única cor da paleta que contrasta com `primaria` tanto em fundo claro quanto escuro.
- **`desabilitado` nunca é o único sinal de um estado.** O PRD exige que mensagens de
  erro não sejam transmitidas só por cor; o mesmo vale para controle inativo.

---

## Escala de espaçamento

Uma progressão só, usada em tudo. Base 4, dobrando — aprovada em 2026-09-20.

| Token | Valor | Onde se usa |
| --- | --- | --- |
| `xs` | `4px` | rótulo e campo; respiro dentro de uma linha |
| `sm` | `8px` | ícone e texto; interior de badge; gap entre linhas de lista |
| `md` | `16px` | padding de card; distância entre campos de formulário |
| `lg` | `24px` | padding de painel; gap entre blocos |
| `xl` | `32px` | entre seções da mesma tela |
| `2xl` | `48px` | respiro do topo da página |

**Decisões registradas:**

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

Proposta "Caixa de feira" — aprovada em 2026-09-20.

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
| normal | fundo `primaria` `#293379`, texto `#ffffff`, raio 4px, padding `8px 20px` (`sm`/`md` da escala), Saira 15px 600 |
| hover | fundo escurece para `#1b2257`, transição de 120ms |
| foco (teclado) | anel de `atencao` `#e5a300`, 3px, deslocado 2px, via `:focus-visible` |
| desabilitado | fundo `desabilitado` `#c3c4d2`, texto `#62647d`, `cursor: not-allowed` |
| carregando | mantém `primaria`, spinner à esquerda, rótulo vira "Processando…", botão inerte |

**Variantes:** secundário usa fundo transparente com contorno `#c8cad8` e texto
`primaria` — não disputa atenção com o primário. Destrutivo usa `perigo` `#b81817`
(hover `#8f1211`).

**Decisões registradas:**

- **O anel de foco é `atencao`, não `primaria`.** Um anel azul em volta de um botão azul
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

**Link:** https://stitch.withgoogle.com/projects/18150998945555448536 (Stitch)

⚠️ **Provisório.** Registrado pelo aluno em 2026-09-20 como rascunho inicial — ainda não
cobre as quatro telas abaixo nem reflete necessariamente os tokens já aprovados. Serve
como ponto de partida, não como referência fechada para implementação.

**Telas que ele deve cobrir** (as das jornadas do `user-flows.md`, não telas soltas —
é isso que faz o protótipo virar insumo da prototipagem assistida em vez de decoração):

| # | Tela | Jornada / Story |
| --- | --- | --- |
| 1 | Registrar compra item a item (com rascunho retomável) | Jornada 2 · US02 |
| 2 | Resumo do mês por categoria e por loja (com desconto de caixa e "Sem loja informada") | US03 |
| 3 | Histórico de preço de um produto, com o limite do plano gratuito | US05 |
| 4 | Assinatura: oferta, "processando pagamento" e estado ativo | Jornada 1 · US06, US07, US12 |

**Para a E1:** a entrega exige `docs/design-tokens.md` commitado. Os tokens estão
fechados; o que falta é o protótipo cobrir as quatro telas acima com a paleta, a
tipografia e a escala já aprovadas. Este documento passa a `1.0.0` quando isso
acontecer e o link deixar de ser provisório.
