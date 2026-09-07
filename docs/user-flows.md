# 🗺️ Jornadas de Usuário

**Projeto:** Pyla — controle de gastos de mercado com comparação colaborativa de preços
**Versão:** 1.0.0 · gerado via `/utf-flows`
**Última atualização:** 2026-09-07

> 🤖 **Este documento é a fonte da verdade sobre O QUE A PESSOA VIVE na tela** —
> o caminho do primeiro clique até o objetivo, e principalmente os pontos onde ela
> trava, espera ou desiste.
>
> ✍️ **Não preencha na mão:** rode `/utf-flows`. A entrevista escolhe a história que
> merece o desenho, obriga o ponto de desistência a aparecer e cobra a decisão sobre
> ele.
>
> 🚫 **Não duplique:** regra de negócio mora no `prd.md`; estado, entidade e contrato
> moram no `architecture.md`. Aqui mora o caminho.

---

## Jornada 1 — Assinar o premium e ter o pagamento confirmado

**Story:** US06 (assinar o premium) + US07 (confirmação assíncrona via webhook)
**Critérios que ela marca:** sai do site e volta · depende do tempo · depende de outra pessoa (o gateway) · pode ser abandonada — **os quatro**. É por isso que o pagamento recorrente é o exemplo canônico da disciplina.

```mermaid
flowchart TD
    A(["Usuário gratuito quer o premium"]) --> B{"Já tem assinatura ativa?"}
    B -->|"sim"| B1["Pyla informa: 'assinatura já ativa'<br/>não cria segundo pedido"]
    B -->|"não"| C["«pessoa» confirma que quer assinar"]
    C --> D["Pyla cria Pedido de assinatura<br/>estado PENDENTE"]
    D --> E(["Checkout do Mercado Pago<br/>fora do site (sandbox)"])
    E --> F{"O que a pessoa faz no gateway?"}
    F -->|"paga"| G["Volta para /assinatura/retorno<br/>«pessoa» vê 'processando pagamento'"]
    F -->|"pagamento recusado"| H["Volta ao Pyla · Pedido RECUSADO<br/>«pessoa» continua gratuita, pode tentar de novo"]
    F -->|"fecha a aba no checkout"| X1[["Some no checkout — o Pedido<br/>fica PENDENTE. Por quanto tempo?"]]
    G --> I{"O webhook de confirmação chegou<br/>e tem assinatura válida?"}
    I -->|"sim, pagamento aprovado"| J(["Pedido PAGO · assinatura ATIVA<br/>«pessoa» é premium — mesmo com o app fechado"])
    I -->|"ainda não chegou"| K["«pessoa» segue vendo 'processando'<br/>continua gratuita, acompanha na tela de assinatura"]
    G --> M[["«pessoa» fecha o app aqui,<br/>antes de qualquer confirmação. O que ela vê ao voltar?"]]
    K --> L[["E se o webhook NUNCA chegar?<br/>a pessoa fica 'processando' para sempre?"]]

    style X1 fill:#ffe0e0,stroke:#c62828
    style M fill:#ffe0e0,stroke:#c62828
    style L fill:#ffe0e0,stroke:#c62828
```

**O que decidimos sobre o nó vermelho X1 — a pessoa fecha o checkout do Mercado Pago sem pagar:**

Quando a pessoa fecha o checkout do Mercado Pago sem pagar, o Pedido de assinatura fica no estado PENDENTE, e ela continua como usuária gratuita — nenhum acesso premium é liberado. Esse pedido pendente não é eterno: ele tem validade de 24 horas. Enquanto está válido, se a pessoa volta ao Pyla, a tela de assinatura mostra "você tem um pagamento aguardando" e oferece retomar o mesmo checkout ou cancelar — o Pyla não cria um segundo pedido. Passadas as 24 horas sem confirmação, o pedido vira EXPIRADO sozinho e a tela volta a mostrar a oferta do premium do zero.

**O que decidimos sobre o nó vermelho M — a pessoa fecha o app antes de qualquer confirmação:**

A ativação do premium é responsabilidade exclusiva do webhook (RN16, US07), então a pessoa não precisa estar com o app aberto para virar premium. Se ela fecha o Pyla logo depois de pagar e reabre mais tarde, a tela de assinatura mostra o estado real daquele momento: se o webhook já confirmou o pagamento, ela já aparece como premium, sem refazer nada; se a confirmação ainda não chegou, ela vê "processando pagamento" e o pedido pendente com seu prazo. Em nenhum caso o Pyla exige uma ação dela para completar a ativação.

**O nó vermelho L — o webhook de confirmação nunca chega — não foi decidido nesta rodada.** Está em Dúvidas em aberto: o `/utf-architecture` precisa dizer se o Pyla consulta o gateway ativamente para reconciliar pedidos pendentes, ou se depende só do webhook (e nesse caso o pedido apenas expira em 24h, com o risco de alguém ter pago de verdade e a assinatura não ativar).

---

## Dúvidas em aberto

| # | Dúvida | Onde ela precisa ser resolvida |
| --- | --- | --- |
| 1 | Se o webhook de confirmação de pagamento nunca chega (perdido, gateway fora do ar), a pessoa que pagou de verdade fica presa em "processando". O Pyla consulta o gateway ativamente (polling / rotina de reconciliação dos pedidos PENDENTES) ou depende exclusivamente do webhook? Se depende só do webhook, o pedido expira em 24h e a pessoa é orientada a tentar de novo — assumindo o risco de pagamento feito sem assinatura ativada. | `/utf-architecture` — consistência do estado de pagamento; ciclo de vida do Pedido de assinatura (PENDENTE → PAGO / RECUSADO / EXPIRADO) e se existe um estado/processo de reconciliação. |
| 2 | Prazo exato e regras finas do "pagamento aguardando" (retomar o mesmo checkout do Mercado Pago é sempre possível dentro das 24h? o link do gateway expira antes disso?). | spec da US06. |
