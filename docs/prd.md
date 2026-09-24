# 📄 Product Requirements Document (PRD)

**Projeto:** Pyla — controle de gastos de mercado com comparação colaborativa de preços
**Versão:** 1.0.0 · gerado via `/utf-prd`
**Última atualização:** 2026-09-05

> 🤖 **Este documento é a fonte da verdade sobre o QUE o produto faz.** Regra de
> negócio que não estiver aqui não existe — nem para a equipe, nem para a IA.
> Tecnologia **não** se discute aqui: isso é assunto do `architecture.md`.
>
> ✍️ **Não preencha na mão:** rode `/utf-prd` — a entrevista percorre as seções
> abaixo, na ordem, e confere o resultado contra a ficha da disciplina
> (`docs/checklist.md`). As respostas são suas; o agente só organiza.

---

## 🎯 1. Visão Geral e Objetivo

**O problema:**
Quem faz a compra do mês não sabe para onde o dinheiro foi. O extrato mostra um
total, mas não quanto foi carne, limpeza ou bebida, nem se o gasto subiu porque
os preços aumentaram ou porque se comprou mais. Some-se a isso a decisão na hora
da compra: na mesma prateleira há embalagens de tamanhos e preços diferentes, e
saber qual compensa exige uma conta que quase ninguém faz de cabeça. As duas
dores têm a mesma causa: a informação de preço existe, mas ninguém a guarda de
forma organizada. Quem tenta anotar em caderno ou planilha desiste, porque dá
trabalho e não devolve nada útil.

**A solução:**
O Pyla registra as compras de mercado item a item e transforma esses registros em
duas respostas: para onde o dinheiro está indo, por categoria, e qual produto
compensa, pelo custo por unidade e pelo histórico de preço entre lojas. O plano
gratuito cobre o registro da compra, o resumo do mês por categoria e a comparação
básica de custo por unidade. A assinatura premium abre o histórico além do mês
corrente, a evolução do gasto ao longo do tempo, a comparação de custo médio
entre lojas e a exportação dos dados.

**Como saberemos que deu certo:**

- Diante de duas embalagens do mesmo produto com pesos e preços diferentes, o
  usuário identifica em segundos qual sai mais barato por quilo ou por litro, sem
  fazer conta de cabeça, e vê por quanto aquele item já foi comprado antes, para
  julgar se o preço da prateleira está bom.
- Ao terminar a compra, o usuário registra os itens de uma vez, com loja e data,
  e esse registro serve a duas coisas ao mesmo tempo: alimenta o controle do
  próprio gasto e passa a valer como referência de preço nas próximas comparações.
- No fim do mês, o usuário abre o resumo e vê quanto gastou em cada categoria e
  em cada loja, sem montar planilha nem somar nada manualmente.
- Depois de alguns meses de uso, o usuário consegue responder se o gasto subiu
  porque os preços aumentaram ou porque comprou mais.

---

## 📖 2. Glossário Ubíquo

> Os termos do negócio, como o cliente fala. É daqui que o `architecture.md`
> deriva os nomes das entidades.

| Termo                       | Significa                                                                                                                        | Não confundir com                                                                                                       |
|:----------------------------|:---------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------|
| **Compra**                  | Uma ida ao mercado: o conjunto de itens levados de uma vez, com uma loja e uma data.                                             | Item de compra — a compra é o todo, o item é cada linha dela.                                                           |
| **Item de compra**          | Cada produto levado numa compra, com quantidade, peso/volume da embalagem e preço pago.                                          | Produto — o item é o produto naquela compra, com aquele preço; o produto é a coisa em si.                               |
| **Produto**                 | Aquilo que se compra, identificado de forma estável para acompanhar preço ao longo do tempo (ex.: "arroz branco 5 kg, marca X"). | Item de compra — o produto se repete entre compras; o item é único de uma compra.                                       |
| **Categoria**               | O grupo ao qual um produto pertence para efeito de resumo de gasto (ex.: carne, limpeza, bebida).                                | Loja — categoria agrupa o que se comprou, não onde.                                                                     |
| **Loja**                    | O estabelecimento onde a compra foi feita.                                                                                       | Marca — a loja é onde se compra; a marca é de quem fabrica o produto.                                                   |
| **Custo por unidade**       | O preço do produto reduzido a uma base comparável: por quilo, por litro ou por unidade avulsa.                                   | Preço pago — o preço pago é o da embalagem inteira; o custo por unidade é ele dividido pelo conteúdo.                   |
| **Histórico de preço**      | A sequência de preços já registrados para um mesmo produto, com loja e data de cada um.                                          | Resumo do mês — o histórico é por produto ao longo do tempo; o resumo é por categoria num período.                      |
| **Resumo do mês**           | A visão de quanto se gastou em cada categoria e em cada loja num período.                                                        | Histórico de preço — ver acima.                                                                                         |
| **Plano / Assinatura**      | O vínculo do usuário com o Pyla: gratuito por padrão, premium enquanto a assinatura estiver ativa e paga.                        | Pagamento — a assinatura é o vínculo contínuo; o pagamento é cada cobrança dela.                                        |
| **Pagamento**               | Cada cobrança da assinatura premium, processada por um gateway externo.                                                          | Assinatura — ver acima.                                                                                                 |
| **Base coletiva de preços** | O conjunto anônimo de preços de produtos por loja e data, formado pela contribuição automática de todas as compras confirmadas.  | Histórico de preço — o histórico é do próprio usuário; a base coletiva agrega preços de todos, sem identificar ninguém. |
| **Rascunho de compra**      | Uma compra começada e ainda não confirmada; fica guardada para o usuário retomar ou descartar.                                   | Compra — só a compra confirmada conta para resumo, histórico e base coletiva.                                           |

---

## 👤 3. Atores e Permissões

> ⚠️ A coluna **"Não pode"** vira Guard e controle de role na API.

| Ator                 | Quem é                                            | Pode                                                                                                                                                                                                                                                                                   | Não pode                                                                                                                                                                                                                                                                    |
|:---------------------|:--------------------------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Visitante**        | Alguém sem conta, ou não autenticado.             | Criar uma conta; fazer login.                                                                                                                                                                                                                                                          | Registrar compras; ver qualquer dado de gasto ou preço; acessar qualquer tela interna.                                                                                                                                                                                      |
| **Usuário gratuito** | Pessoa autenticada, sem assinatura premium ativa. | Registrar, editar e excluir as próprias compras; classificar itens usando as categorias fixas do sistema; ver o resumo do mês corrente por categoria e por loja; comparar custo por unidade entre produtos; ver o histórico de preço do mês corrente; assinar o premium.               | Ver histórico ou resumo de meses anteriores ao corrente; ver evolução de gasto ao longo do tempo; ver comparação de custo médio entre lojas; ver o preço colaborativo; exportar dados; criar categorias personalizadas; acessar compras ou dados de qualquer outro usuário. |
| **Usuário premium**  | Pessoa autenticada com assinatura premium ativa.  | Tudo do usuário gratuito, sem limite de período: histórico completo, evolução de gasto ao longo do tempo, custo médio comparado entre lojas, preço colaborativo, exportação dos próprios dados; criar e usar categorias personalizadas; gerenciar a assinatura (ver status, cancelar). | Acessar dados de qualquer outro usuário; tornar-se premium sem um pagamento confirmado; reativar o premium sem uma nova cobrança confirmada.                                                                                                                                |

> **Sem ator administrador.** A diferença de role/Guard exigida pela disciplina
> (ID9) é demonstrada pelo par gratuito × premium: mesma autenticação JWT,
> permissões de acesso diferentes a dados e recursos.
>
> **Categorias personalizadas e rebaixamento de plano.** Se a assinatura premium
> expira, as categorias personalizadas já criadas continuam existindo nos
> registros históricos, mas o usuário rebaixado a gratuito não pode criar novas
> nem reclassificar itens com elas (RN13).

---

## 📝 4. Escopo Funcional (User Stories)

> Uma story por vez, no formato do modelo abaixo. Cada uma carrega dois eixos:
> **Prioridade (MoSCoW)** — `Must Have` é o escopo comprometido do projeto
> (o escopo mínimo da ficha é `Must Have` por definição); `Should`/`Could`
> entram se sobrar tempo, mas ficam documentadas — nada se perde; o
> `Won't Have` vira item da seção *Fora de Escopo* — e **Tamanho (esforço)** —
> `S` cabe numa sessão, `M` vira algumas tarefas no plano, `L` pede divisão.
> Toda story nasce `Draft` — **só você promove a `Ready`**; `Live` é quando o PR
> da história mescla (o auditor final confere).

### US01 — Criar conta e autenticar · `Must Have` · `S–M` · Status: `🟡 Ready`

<!-- Status: `⚪ Draft` (não codificar) · `🟡 Ready` (vira Issue) · `🟢 Live` (PR mesclado) -->

**Como** visitante, **eu quero** criar uma conta e fazer login, **para que** minhas
compras e meus preços fiquem guardados só para mim e protegidos de acesso alheio.

**Critérios de aceite:**

- [ ] **Dado** um visitante na tela de cadastro, **quando** ele informa um e-mail válido e uma senha que atende à política mínima, **então** a conta é criada como usuário gratuito e ele é autenticado.
- [ ] **Dado** um e-mail já cadastrado, **quando** o visitante tenta criar conta com esse mesmo e-mail, **então** o cadastro é recusado com uma mensagem que não revela se o e-mail existe, e nenhuma conta duplicada é criada.
- [ ] **Dado** um e-mail em formato inválido ou uma senha fora da política, **quando** o visitante envia o formulário, **então** o cadastro é recusado com a indicação do campo problemático e nada é persistido.
- [ ] **Dado** um usuário já cadastrado, **quando** ele faz login com e-mail e senha corretos, **então** recebe um token de acesso válido e passa a enxergar a área autenticada.
- [ ] **Dado** um usuário cadastrado, **quando** ele tenta login com senha errada ou e-mail inexistente, **então** o acesso é negado com uma mensagem genérica, sem distinguir qual campo falhou.
- [ ] **Dado** um usuário sem token, ou com token expirado/inválido, **quando** ele tenta acessar qualquer recurso interno (compras, resumo, histórico), **então** o acesso é negado e ele é levado ao login.
- [ ] **Dado** um usuário autenticado, **quando** ele faz logout, **então** o token deixa de dar acesso aos recursos internos.

**Regras relacionadas:** RN01, RN02

---

### US02 — Registrar uma compra item a item · `Must Have` · `L` · Status: `🟡 Ready`

**Como** usuário autenticado, **eu quero** registrar uma compra inteira de uma vez —
loja, data e cada item com quantidade, tamanho da embalagem e preço pago — **para
que** esse registro alimente o controle do meu gasto e passe a valer como
referência de preço nas próximas comparações.

**Critérios de aceite:**

- [ ] **Dado** um usuário autenticado iniciando uma nova compra, **quando** ele informa a data e ao menos um item completo (produto, quantidade, tamanho da embalagem com unidade de medida, e preço cheio), **então** a compra é registrada com todos os seus itens e passa a aparecer entre as compras do usuário.
- [ ] **Dado** um usuário que digitou o nome de um produto que ele já registrou antes, **quando** ele começa a digitar, **então** o sistema oferece o produto existente para reaproveitar, em vez de criar um produto duplicado.
- [ ] **Dado** um produto que nunca foi registrado, **quando** o usuário confirma a compra, **então** o produto é criado e associado a uma categoria (fixa do sistema; personalizada só se o usuário for premium).
- [ ] **Dado** um usuário que permitiu o acesso à localização, **quando** ele inicia uma compra, **então** o sistema sugere a loja conhecida mais próxima, e o usuário pode aceitar a sugestão ou escolher/digitar outra loja.
- [ ] **Dado** um usuário que negou a localização, ou que não tem nenhuma loja conhecida por perto, **quando** ele inicia a compra, **então** o campo loja fica em branco para preenchimento manual, sem bloquear o registro.
- [ ] **Dado** um item, **quando** o usuário informa um desconto para ele, **então** o desconto é aceito se for maior ou igual a zero e não maior que o preço cheio multiplicado pela quantidade; o preço com desconto do item passa a ser o valor que alimenta histórico, comparação e base coletiva.
- [ ] **Dado** que o usuário informa o total efetivamente pago na compra, **quando** ele confirma, **então** o valor é aceito se for maior ou igual a zero e não maior que a soma dos itens já com seus descontos; a diferença é registrada como desconto de caixa.
- [ ] **Dado** um item com preço cheio igual a zero ou negativo, quantidade não positiva, ou tamanho de embalagem ausente/não positivo, **quando** o usuário tenta confirmar a compra, **então** a compra inteira é recusada com a indicação do item e do campo problemático, e nada é persistido.
- [ ] **Dado** uma data de compra no futuro, **quando** o usuário tenta confirmar, **então** o registro é recusado com mensagem clara.
- [ ] **Dado** uma compra sem nenhum item, **quando** o usuário tenta confirmar, **então** o registro é recusado — uma compra precisa de ao menos um item.
- [ ] **Dado** que o usuário sai da tela antes de confirmar uma compra, **quando** ele volta ao Pyla, **então** encontra a compra como rascunho para retomar ou descartar; e enquanto for rascunho, ela não aparece no resumo do mês, não entra no histórico de preço nem na base coletiva.
- [ ] **Dado** um rascunho de compra, **quando** o usuário o descarta, **então** nenhum dado dele é persistido de forma definitiva.
- [ ] **Dado** uma compra registrada com sucesso, **quando** o registro é concluído, **então** cada preço com desconto de item passa imediatamente a compor o histórico de preço daquele produto e a base coletiva anônima de preços (produto, preço unitário, loja e data, sem qualquer dado que identifique o usuário), e o usuário é informado, na própria tela de confirmação, de que preços registrados alimentam a comparação colaborativa de forma anônima.

**Regras relacionadas:** RN03, RN04, RN05, RN06, RN07, RN08, RN09, RN10, RN11, RN23

---

### US03 — Ver o resumo do mês por categoria e por loja · `Must Have` · `M` · Status: `🟡 Ready`

**Como** usuário autenticado, **eu quero** ver, para o mês corrente, quanto gastei em
cada categoria e em cada loja, **para que** eu saiba para onde o dinheiro foi sem
montar planilha nem somar nada.

**Critérios de aceite:**

- [ ] **Dado** um usuário com compras confirmadas no mês corrente, **quando** ele abre o resumo, **então** vê o total gasto no mês e a quebra por categoria e por loja, cada uma com seu subtotal, mais uma linha própria para o desconto de caixa, conciliando com o total.
- [ ] **Dado** um usuário sem nenhuma compra confirmada no mês corrente, **quando** ele abre o resumo, **então** vê um estado vazio explícito ("nenhuma compra registrada neste mês"), não uma tela em branco nem erro.
- [ ] **Dado** um usuário gratuito, **quando** ele tenta ver o resumo de um mês anterior ao corrente, **então** o acesso é bloqueado com um convite para assinar o premium.
- [ ] **Dado** um usuário premium, **quando** ele escolhe um mês anterior, **então** vê o resumo daquele mês no mesmo formato.
- [ ] **Dado** um item cujo produto pertence a uma categoria personalizada que deixou de estar disponível (premium expirado ou categoria excluída), **quando** o resumo é montado, **então** o gasto daquele item ainda é contabilizado sob o nome da categoria com que foi registrado.
- [ ] **Dado** o resumo por loja, **quando** existem compras sem loja informada, **então** elas aparecem agrupadas como "Sem loja informada".

**Regras relacionadas:** RN07, RN08, RN09, RN13, RN14

---

### US04 — Comparar custo por unidade entre produtos · `Must Have` · `S–M` · Status: `🟡 Ready`

**Como** usuário autenticado, **eu quero** comparar duas ou mais embalagens de
tamanhos e preços diferentes pelo custo por quilo, litro ou unidade, **para que**
eu saiba na hora qual compensa, sem fazer conta de cabeça.

**Critérios de aceite:**

- [ ] **Dado** um usuário que informa, para dois ou mais produtos, o preço e o tamanho da embalagem (com unidade compatível), **quando** ele pede a comparação, **então** vê o custo por unidade-base de cada um e qual é o mais barato, destacado.
- [ ] **Dado** que a comparação é uma calculadora avulsa, **quando** o usuário a usa, **então** ele digita preço e tamanho na hora, sem precisar ter registrado nenhuma compra ou produto.
- [ ] **Dado** produtos com unidades da mesma família (g e kg, mL e L), **quando** são comparados, **então** o sistema converte para uma base comum antes de comparar.
- [ ] **Dado** produtos com unidades incompatíveis (massa contra contagem, volume contra contagem), **quando** o usuário tenta compará-los, **então** o sistema recusa a comparação com mensagem clara, em vez de mostrar um resultado sem sentido.
- [ ] **Dado** um preço ou tamanho ausente, zero ou negativo em algum dos produtos comparados, **quando** o usuário pede a comparação, **então** ela é recusada com a indicação do campo.
- [ ] **Dado** dois produtos com custo por unidade idêntico, **quando** comparados, **então** o sistema indica empate, sem eleger um "vencedor" arbitrário.

**Regras relacionadas:** RN04, RN15

---

### US05 — Ver o histórico de preço de um produto · `Must Have` · `M` · Status: `🟡 Ready`

**Como** usuário autenticado, **eu quero** ver por quanto, onde e quando um produto já
foi comprado, **para que** eu julgue se o preço da prateleira agora está bom.

**Critérios de aceite:**

- [ ] **Dado** um produto que o usuário já registrou em compras confirmadas, **quando** ele abre o histórico desse produto, **então** vê cada registro de preço com data, loja e preço unitário (com desconto do item), do mais recente ao mais antigo.
- [ ] **Dado** o histórico de um produto, **quando** ele é exibido, **então** o último valor registrado para aquele produto fica destacado como referência para julgar a prateleira.
- [ ] **Dado** um usuário gratuito, **quando** ele abre o histórico de um produto, **então** vê apenas os registros do mês corrente, com um aviso de que o histórico completo é premium.
- [ ] **Dado** um usuário premium, **quando** ele abre o histórico, **então** vê todos os registros, sem limite de período.
- [ ] **Dado** um produto que o usuário nunca registrou (ou registrou só em rascunho), **quando** ele tenta ver o histórico, **então** vê um estado vazio explícito.

**Regras relacionadas:** RN04, RN07, RN14

---

### US06 — Assinar o premium (pagamento recorrente em sandbox) · `Must Have` · `L` · Status: `🟡 Ready`

**Como** usuário gratuito, **eu quero** contratar a assinatura premium pagando por um
meio seguro, **para que** eu libere o histórico completo, a evolução do gasto, a
comparação entre lojas e a exportação.

**Critérios de aceite:**

- [ ] **Dado** um usuário gratuito autenticado, **quando** ele escolhe assinar o premium, **então** o Pyla cria um pedido de assinatura no seu próprio banco (estado inicial "pendente") e o encaminha ao gateway de pagamento (Mercado Pago) em ambiente de testes.
- [ ] **Dado** um pagamento recusado pelo gateway, **quando** o retorno é recebido, **então** o pedido fica "recusado", o usuário continua gratuito e é informado, com opção de tentar de novo.
- [ ] **Dado** um usuário que abandona o checkout do gateway sem concluir, **quando** ele volta ao Pyla, **então** o pedido permanece "pendente", ele continua gratuito, e nenhum acesso premium é liberado.
- [ ] **Dado** um usuário que já tem assinatura ativa, **quando** ele tenta assinar de novo, **então** o Pyla não cria um segundo pedido e informa que a assinatura já está ativa.
- [ ] **Dado** qualquer tela do fluxo, **quando** ela é exibida, **então** nenhuma chave de API do gateway aparece no cliente nem no repositório.
- [ ] **Dado** que a ativação do premium é responsabilidade exclusiva da confirmação por webhook (US07), **quando** o usuário retorna do gateway, **então** o Pyla não concede acesso premium só pelo retorno da tela — aguarda a confirmação assíncrona.

**Regras relacionadas:** RN16, RN17, RN20

---

### US07 — Confirmação assíncrona do pagamento via webhook · `Must Have` · `M` · Status: `🟡 Ready`

**Como** dono do produto, **eu quero** que o Pyla receba do gateway a confirmação do
pagamento por webhook, com a assinatura da notificação verificada, **para que** o
estado da assinatura do usuário fique sempre consistente com o que de fato foi
pago, mesmo que o usuário feche o app.

**Critérios de aceite:**

- [ ] **Dado** um webhook recebido do gateway com assinatura válida notificando pagamento aprovado, **quando** o Pyla o processa, **então** o pedido correspondente passa a "pago" e a assinatura do usuário fica "ativa" — mesmo que o usuário não esteja com o app aberto.
- [ ] **Dado** um webhook com assinatura ausente ou inválida, **quando** ele chega, **então** é rejeitado sem alterar nenhum pedido ou assinatura, e o evento é registrado.
- [ ] **Dado** o mesmo webhook entregue duas vezes (reenvio do gateway), **quando** o segundo chega, **então** o estado não muda de novo nem gera efeito duplicado (idempotência).
- [ ] **Dado** um webhook que notifica falha, estorno ou cancelamento de um pagamento antes concluído, **quando** processado, **então** a assinatura é marcada para não renovar, mas o acesso premium permanece até o fim do período já pago.
- [ ] **Dado** um webhook para um pedido que o Pyla não reconhece, **quando** ele chega, **então** é registrado e ignorado com segurança, sem erro que derrube o endpoint.

**Regras relacionadas:** RN16, RN18, RN19, RN20

---

### US08 — Ver evolução do gasto ao longo do tempo · `Should Have` · `M` · Status: `⚪ Draft`

**Como** usuário premium, **eu quero** ver meu gasto mês a mês e distinguir "os preços
subiram" de "eu comprei mais", **para que** eu entenda a causa da variação.

**Critérios de aceite:**

- [ ] **Dado** um premium com compras em vários meses, **quando** abre a evolução, **então** vê o gasto total por mês numa série temporal.
- [ ] **Dado** a mesma tela, **quando** exibida, **então** separa a variação atribuível a preço (mesmos produtos, preço diferente) da variação por volume (quantidade diferente).
- [ ] **Dado** um premium com menos de dois meses de dados, **quando** abre a evolução, **então** vê um aviso de que a comparação precisa de mais histórico.
- [ ] **Dado** um usuário gratuito, **quando** tenta acessar, **então** é bloqueado com convite ao premium.

**Regras relacionadas:** RN14

---

### US09 — Comparar custo médio entre lojas · `Should Have` · `M` · Status: `🟡 Ready`

**Como** usuário premium, **eu quero** ver, por produto ou por categoria, qual loja tem
saído mais barata, **para que** eu decida onde comprar.

**Critérios de aceite:**

- [ ] **Dado** um premium com registros do mesmo produto em lojas diferentes, **quando** abre a comparação, **então** vê o custo médio por unidade em cada loja, ordenado da mais barata para a mais cara.
- [ ] **Dado** um produto registrado em uma só loja, **quando** abre a comparação, **então** vê um aviso de que não há outra loja para comparar.
- [ ] **Dado** a comparação por categoria, **quando** exibida, **então** agrega o custo dos produtos daquela categoria por loja.
- [ ] **Dado** um usuário gratuito, **quando** tenta acessar, **então** é bloqueado com convite ao premium.

**Regras relacionadas:** RN09, RN14

---

### US10 — Exportar os dados · `Should Have` · `S` · Status: `🟡 Ready`

**Como** usuário premium, **eu quero** baixar minhas compras e preços num arquivo,
**para que** eu use os dados fora do Pyla.

**Critérios de aceite:**

- [ ] **Dado** um premium, **quando** pede a exportação, **então** recebe um arquivo com suas compras e itens (data, loja, produto, categoria, quantidade, tamanho, preço cheio, desconto, preço com desconto).
- [ ] **Dado** um premium sem nenhuma compra, **quando** pede a exportação, **então** recebe um arquivo válido, apenas com o cabeçalho, e um aviso de que não há dados.
- [ ] **Dado** um usuário gratuito, **quando** tenta exportar, **então** é bloqueado com convite ao premium.
- [ ] **Dado** a exportação, **quando** gerada, **então** contém só dados do próprio usuário — nada da base coletiva de outras pessoas.

**Regras relacionadas:** RN14, RN21

---

### US11 — Criar e usar categorias personalizadas · `Could Have` · `S–M` · Status: `⚪ Draft`

**Como** usuário premium, **eu quero** criar categorias próprias além das fixas, **para
que** o resumo reflita a forma como eu penso meus gastos.

**Critérios de aceite:**

- [ ] **Dado** um premium, **quando** cria uma categoria com um nome que ele ainda não usou, **então** ela passa a estar disponível para classificar itens, junto das fixas.
- [ ] **Dado** um nome de categoria repetido (dele ou igual a uma fixa), **quando** ele tenta criar, **então** a criação é recusada.
- [ ] **Dado** uma categoria personalizada em uso, **quando** o premium a exclui, **então** os itens já classificados com ela mantêm o nome registrado.
- [ ] **Dado** um usuário gratuito, **quando** tenta criar categoria, **então** é bloqueado com convite ao premium.

**Regras relacionadas:** RN11, RN12, RN13, RN14

---

### US12 — Gerenciar a assinatura · `Should Have` · `S` · Status: `🟡 Ready`

**Como** usuário premium, **eu quero** ver o estado da minha assinatura e cancelar a
renovação, **para que** eu controle o que pago.

**Critérios de aceite:**

- [ ] **Dado** um premium, **quando** abre a gestão da assinatura, **então** vê o estado atual (ativa, cancelada, expirada) e a data do fim do período pago.
- [ ] **Dado** um premium ativo, **quando** cancela a renovação, **então** a assinatura passa a "cancelada", mas o acesso premium continua até o fim do período já pago.
- [ ] **Dado** uma assinatura cancelada cujo período pago terminou, **quando** o sistema avalia o acesso, **então** o usuário volta a gratuito e passa a ver os limites de período de novo.
- [ ] **Dado** um usuário gratuito sem histórico de assinatura, **quando** abre a tela, **então** vê a oferta do premium, não uma tela de gestão vazia.

**Regras relacionadas:** RN19

---

### US13 — Ver o preço colaborativo de um produto em outras lojas · `Should Have` · `M–L` · Status: `🟡 Ready`

**Como** usuário premium, **eu quero** ver o preço típico de um produto em outras
lojas, agregado e anônimo, a partir do que outros usuários registraram, **para
que** eu saiba se vale procurar em outro lugar.

**Critérios de aceite:**

- [ ] **Dado** um produto com registros de preço de vários usuários em lojas que o premium ainda não visitou, **quando** ele abre o preço colaborativo, **então** vê, por loja, um preço típico agregado (ex.: mediana) e a data do registro mais recente — sem identificar nenhum usuário.
- [ ] **Dado** um produto com poucos registros de terceiros (abaixo de um mínimo definido na spec), **quando** ele abre a tela, **então** vê um aviso de que ainda não há dados suficientes para um preço confiável, em vez de um número frágil.
- [ ] **Dado** um valor muito fora da curva na base (erro de digitação de alguém), **quando** o preço típico é calculado, **então** esse valor extremo não distorce o resultado exibido.
- [ ] **Dado** a tela do preço colaborativo, **quando** exibida, **então** nenhum dado permite ligar um preço a uma pessoa, e nenhum total de gasto de ninguém aparece.
- [ ] **Dado** um usuário gratuito, **quando** tenta acessar, **então** é bloqueado com convite ao premium.

**Regras relacionadas:** RN06, RN14, RN21, RN22

---

### US14 — Corrigir uma compra registrada · `Must Have` · `S–M` · Status: `🟡 Ready`

**Como** usuário autenticado, **eu quero** editar ou excluir uma compra que já
registrei, **para que** um erro de lançamento não distorça meu controle de gasto
nem a base de preços.

**Critérios de aceite:**

- [ ] **Dado** uma compra confirmada do usuário, **quando** ele corrige a loja, a data ou os dados de um item (preço cheio, desconto, quantidade, tamanho), **então** a compra é atualizada, e o resumo do mês, o histórico de preço e a base coletiva passam a refletir os valores corrigidos.
- [ ] **Dado** uma compra confirmada, **quando** o usuário exclui a compra inteira, **então** ela some do seu controle, e seus preços são removidos do histórico do produto e da base coletiva.
- [ ] **Dado** uma compra confirmada com mais de um item, **quando** o usuário remove um item específico, **então** só aquele item e seu preço são retirados.
- [ ] **Dado** uma compra confirmada com um único item, **quando** o usuário tenta remover esse item, **então** o sistema impede a remoção e orienta a excluir a compra inteira para zerá-la.
- [ ] **Dado** uma correção que deixaria um item com preço, quantidade, tamanho ou desconto inválido, **quando** o usuário tenta salvar, **então** a alteração é recusada com a indicação do campo, e a compra permanece como estava.
- [ ] **Dado** um usuário que tenta editar ou excluir uma compra que não é dele, **quando** a requisição chega, **então** é negada.
- [ ] **Dado** uma compra de qualquer época (inclusive de meses anteriores), **quando** o dono a corrige ou exclui, **então** a operação é permitida — não há janela de tempo para correção.

**Regras relacionadas:** RN03, RN04, RN08, RN21, RN23

---

## 🛡️ 5. Regras de Negócio (Constraints)

| ID   | Regra                                                                                                                                                                                                                                                                                                                                                                                          |
|:-----|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| RN01 | Um e-mail identifica no máximo uma conta. Tentativa de cadastro com e-mail já usado é recusada sem revelar que o e-mail existe.                                                                                                                                                                                                                                                                |
| RN02 | A senha deve ter no mínimo 8 caracteres, com ao menos uma letra e um número.                                                                                                                                                                                                                                                                                                                   |
| RN03 | Toda compra confirmada tem pelo menos um item. Não existe compra confirmada sem itens; não se remove o último item de uma compra (para zerá-la, exclui-se a compra).                                                                                                                                                                                                                           |
| RN04 | Em todo item: preço cheio > 0, quantidade > 0, tamanho da embalagem > 0, unidade em {kg, g, L, mL, unidade}. O desconto do item é ≥ 0 e ≤ preço cheio × quantidade. O preço com desconto do item (preço cheio × quantidade − desconto do item) é o valor que alimenta histórico de preço, comparação e base coletiva.                                                                          |
| RN05 | A data de uma compra não pode ser futura.                                                                                                                                                                                                                                                                                                                                                      |
| RN06 | Toda compra confirmada contribui, de forma anônima, para a base coletiva de preços: produto, preço unitário, loja e data, sem nenhum dado que identifique o usuário. O usuário é informado disso ao confirmar a compra.                                                                                                                                                                        |
| RN07 | Compra em rascunho não conta para nada: não aparece no resumo do mês, não entra no histórico de preço nem na base coletiva. Só a confirmação a torna efetiva.                                                                                                                                                                                                                                  |
| RN08 | O total de uma compra é a soma dos itens (cada item pelo seu preço com desconto) menos o desconto de caixa. O usuário informa o total efetivamente pago; o desconto de caixa é a diferença entre a soma dos itens e esse total. Todos os descontos são opcionais (default zero). O desconto de caixa aparece como linha própria no resumo do mês e não altera o preço unitário de nenhum item. |
| RN09 | A loja é opcional na compra. Compras sem loja são agrupadas como "Sem loja informada" nos resumos e comparações.                                                                                                                                                                                                                                                                               |
| RN10 | Um produto é único por usuário e reutilizado entre compras; o mesmo nome não gera produtos duplicados.                                                                                                                                                                                                                                                                                         |
| RN11 | Todo produto pertence a uma categoria. As categorias fixas do sistema estão disponíveis para todos; categorias personalizadas só podem ser criadas e atribuídas por usuário premium.                                                                                                                                                                                                           |
| RN12 | O nome de uma categoria é único: não se repete entre as fixas nem entre as personalizadas de um mesmo usuário.                                                                                                                                                                                                                                                                                 |
| RN13 | Uma categoria personalizada usada em registros históricos é preservada mesmo que a assinatura premium expire ou a categoria seja excluída: os itens já classificados mantêm o nome da categoria com que foram registrados.                                                                                                                                                                     |
| RN14 | Recursos premium — resumo e histórico além do mês corrente, evolução do gasto, comparação de custo médio entre lojas, exportação, categorias personalizadas, preço colaborativo — só são acessíveis com assinatura premium ativa. O usuário gratuito que os solicita recebe um convite para assinar.                                                                                           |
| RN15 | A comparação de custo por unidade só ocorre entre unidades da mesma família (massa com massa, volume com volume, contagem com contagem). Famílias incompatíveis: comparação recusada.                                                                                                                                                                                                          |
| RN16 | A ativação do premium acontece exclusivamente pela confirmação de pagamento recebida por webhook. O redirecionamento do usuário ao gateway, por si só, não concede acesso.                                                                                                                                                                                                                     |
| RN17 | Um usuário com assinatura ativa não pode gerar um novo pedido de assinatura enquanto a atual estiver vigente.                                                                                                                                                                                                                                                                                  |
| RN18 | O processamento de webhooks é idempotente: a mesma notificação recebida mais de uma vez não produz efeito adicional. Webhook com assinatura inválida ou para pedido desconhecido é registrado e ignorado, sem alterar estado.                                                                                                                                                                  |
| RN19 | Cancelamento de assinatura ou estorno não derrubam o premium imediatamente: o acesso vale até o fim do período já pago. Depois disso, o usuário volta a gratuito.                                                                                                                                                                                                                              |
| RN20 | Chaves de API e segredos do gateway nunca aparecem no cliente nem no repositório.                                                                                                                                                                                                                                                                                                              |
| RN21 | Todo dado de compra, produto, histórico e assinatura é privado do seu dono. Nenhum usuário acessa, edita ou exclui dado de outro. A única informação que circula entre usuários é o preço agregado e anônimo da base coletiva.                                                                                                                                                                 |
| RN22 | O preço colaborativo exibido é um agregado robusto (ex.: mediana) que descarta valores extremos, e só é mostrado quando há um número mínimo de registros de terceiros. Os limiares ficam para a spec da US13.                                                                                                                                                                                  |
| RN23 | O total pago informado pelo usuário é ≥ 0 e ≤ soma dos itens (já com os descontos de item). Valor fora disso é recusado no registro da compra.                                                                                                                                                                                                                                                 |

---

## 🚫 6. Fora de Escopo (Non-goals)

> O que o produto deliberadamente **não** faz neste semestre — o `Won't Have`
> do MoSCoW, com o motivo de cada corte.

- **Leitura de foto (etiqueta de gôndola ou nota/cupom fiscal) para extrair produto e preço.** Exige OCR/visão computacional, parsing de layouts de cupom que variam por estado e rede, e um fluxo de correção do que veio errado — um subsistema inteiro, notoriamente impreciso, sem relação com nenhum ID da disciplina e difícil de defender se não estiver muito bem-feito. Fica como evolução futura; o registro do semestre é manual, acelerado por sugestão de loja via GPS e reaproveitamento de produtos já cadastrados.
- **Encerramento da própria conta pelo usuário.** Envolve política de retenção/apagamento de dados (inclusive a contribuição já feita à base coletiva) que não cabe no escopo; o usuário gratuito simplesmente para de usar.
- **Recuperação de senha ("esqueci minha senha").** Depende de envio de e-mail transacional — infraestrutura extra sem ID que a cobre.
- **Lista de compras planejada antes de ir ao mercado, metas de gasto e orçamento por categoria.** O Pyla registra o que já foi comprado e mostra para onde o dinheiro foi; planejamento prévio e alertas de meta são outro produto.
- **Aplicativo móvel nativo.** A interface é web e consome a API; recursos como localização usam o que o navegador oferece.
- **Compartilhamento de uma conta entre membros de uma família (compra conjunta, múltiplos perfis num mesmo domicílio).** Cada conta é individual e privada; modelar domicílio com vários usuários é escopo próprio.
- **Cobrança real.** O pagamento da assinatura roda exclusivamente em ambiente de testes (sandbox) do gateway; nenhuma cobrança de verdade é processada.
- **Catálogo global de produtos / código de barras.** Cada usuário mantém seus próprios produtos; não há base canônica compartilhada de produtos nem leitura de código de barras. A única informação coletiva é o preço agregado e anônimo.
- **Reajuste/rateio do desconto de caixa entre itens.** O desconto de caixa entra como linha própria no resumo e não altera o preço unitário dos itens.

---

## ⚙️ 7. Requisitos Não Funcionais (Qualidade)

> Só os que você consegue justificar na defesa.

- **Privacidade dos dados pessoais.** Compras, produtos, histórico e assinatura são visíveis apenas para o dono (RN21). Toda rota que devolve esses dados exige autenticação e filtra pelo usuário do token. A única informação que cruza a fronteira entre usuários é o preço agregado e anônimo da base coletiva (RN06), sem nenhum campo que permita reidentificar quem registrou.
- **Segurança de credenciais.** Senhas são armazenadas com hash (nunca em texto puro). Segredos do gateway de pagamento e a string de conexão do banco vivem só em variáveis de ambiente da plataforma, nunca no repositório (RN20).
- **Consistência do estado de pagamento.** O estado da assinatura reflete sempre o que foi efetivamente pago, mesmo diante de notificações duplicadas, fora de ordem ou com assinatura inválida (RN16, RN18, RN19). Nenhuma condição de webhook pode deixar um pedido "pago" sem assinatura ativa, ou o contrário.
- **Integridade da comparação de preços.** Valores usados nas comparações e no preço colaborativo passam por validação de domínio (RN04, RN23) e, no caso coletivo, por agregação robusta que descarta extremos (RN22) — um dado digitado errado não deve contaminar a informação exibida a outros.
- **Confiabilidade da entrada da API.** Toda entrada da API é validada antes de qualquer processamento; requisição malformada é recusada com erro claro, sem efeito colateral e sem vazar detalhe interno.
- **Feedback em estados vazios e de erro.** Toda tela que pode não ter dados (resumo sem compras, histórico de produto novo, comparação com uma loja só) mostra um estado vazio explícito, nunca uma tela em branco ou um erro técnico.
- **Acessibilidade mínima do frontend.** As telas principais (registro de compra, resumo do mês, comparação de custo por unidade, histórico de preço) são operáveis por teclado, com foco visível; campos de formulário têm rótulo associado; mensagens de erro são apresentadas de forma programática, não só por cor; o contraste de texto segue o mínimo WCAG AA.
- **Idioma.** Interface e mensagens ao usuário em português do Brasil; dados e código em inglês.

---

## 🛠️ 8. Histórico

| Data       | Versão | O que mudou                   |
|:-----------|:-------|:------------------------------|
| 2026-09-05 | 1.0.0  | Versão inicial via `/utf-prd` |
