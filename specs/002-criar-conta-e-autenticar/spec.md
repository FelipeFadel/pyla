---
issue: 2
status: rascunho
---

# US01 — Criar conta e autenticar

## O problema

Hoje o Pyla não distingue ninguém: não existe conta, e portanto não existe "minhas compras". Sem identidade, nenhum dado de gasto ou de preço pode ser privado de quem o registrou (RN21), e nenhuma outra história consegue começar. Quem usa o produto precisa de uma forma simples de criar uma conta, entrar e sair, com a garantia de que os dados dele ficam protegidos de acesso alheio.

## A história

**Como** visitante, **eu quero** criar uma conta e fazer login, **para que** minhas compras e meus preços fiquem guardados só para mim e protegidos de acesso alheio.

## Critérios de aceite

- [ ] **CA1 — Dado** um visitante na tela de cadastro, **quando** ele informa um e-mail válido e uma senha que atende à política (RN02: 8 a 72 caracteres, com ao menos uma letra e um número), **então** a conta é criada como usuário gratuito (sem assinatura), a resposta é de sucesso, o navegador recebe o cookie de sessão `httpOnly` e o visitante já chega autenticado à área interna, sem passar pelo login.
- [ ] **CA2 — Dado** um e-mail já cadastrado, **quando** o visitante tenta criar conta com esse e-mail (inclusive escrito com outras maiúsculas ou com espaços nas pontas), **então** o cadastro é recusado com status 400 e uma mensagem genérica, igual a qualquer outra recusa de cadastro e sem citar o e-mail, e nenhuma conta duplicada é criada.
- [ ] **CA3 — Dado** um e-mail em formato inválido ou uma senha fora da política (menos de 8 caracteres, sem letra, sem número ou com mais de 72 caracteres), **quando** o visitante envia o formulário, **então** o cadastro é recusado com status 400, a resposta indica qual campo está errado, e nada é gravado.
- [ ] **CA4 — Dado** uma conta criada, **quando** se consulta o banco ou qualquer resposta da API, **então** a senha existe só como hash (nunca em texto puro) e nenhuma resposta devolve a senha nem o hash.
- [ ] **CA5 — Dado** um usuário cadastrado, **quando** ele faz login com e-mail (sem diferenciar maiúsculas) e senha corretos, **então** o navegador recebe o cookie de sessão `httpOnly` com validade de 7 dias, e uma consulta à sessão atual devolve o id e o e-mail dele, e o front mostra a área interna.
- [ ] **CA6 — Dado** um usuário cadastrado, **quando** ele tenta login com senha errada ou com e-mail inexistente, **então** o acesso é negado com status 401 e uma mensagem genérica idêntica nos dois casos, sem cookie de sessão.
- [ ] **CA7 — Dado** um usuário sem cookie de sessão, ou com sessão expirada ou inválida, **quando** ele tenta acessar qualquer rota interna da API, **então** a resposta é 401 e o front o leva à tela de login. Só cadastro e login são abertos.
- [ ] **CA8 — Dado** um usuário autenticado, **quando** ele faz logout, **então** o cookie de sessão é removido e o token que ele tinha deixa de dar acesso (resposta 401 se reutilizado), inclusive em outro dispositivo onde estivesse logado.
- [ ] **CA9 — Dado** dois cadastros enviados ao mesmo tempo com o mesmo e-mail, **quando** ambos chegam à API, **então** exatamente uma conta é criada e o outro recebe a mesma recusa do CA2.
- [ ] **CA10 — Dado** um visitante que envia o cadastro ou o login e a rede falha (sem resposta do servidor), **quando** a requisição não completa, **então** o front mostra uma mensagem de erro em português, mantém o formulário preenchido e permite tentar de novo, sem tela em branco.
- [ ] **CA11 — Dado** as telas de cadastro e de login, **quando** o visitante as usa, **então** o campo de senha não aceita digitar mais de 72 caracteres, todo campo tem rótulo associado, cada erro de validação é apresentado junto ao campo de forma programática (não só por cor), e a tela é operável só pelo teclado.

## Fora de escopo

- Recuperação de senha ("esqueci minha senha"): exige envio de e-mail e está nos *non-goals* do PRD.
- Encerramento da própria conta pelo usuário: está nos *non-goals* do PRD.
- Confirmação de e-mail e login social (Google etc.).
- Limite de tentativas de login (proteção contra força bruta) e bloqueio de conta.
- Troca de senha e troca de e-mail pelo usuário já logado.
- Assinatura e papel premium: a conta nasce gratuita e nada aqui cria `Subscription` (US06 e US07).
- Documentação Swagger da API: o `architecture.md` §2.2 a prevê, mas ela entra em história própria.
- Ajuste do `SameSite` do cookie para o web e a API em domínios diferentes em produção: pertence ao deploy (Atividade 15).
- Qualquer tela ou rota de compras, resumo ou histórico: a "área interna" desta história é uma página mínima que só prova que a sessão existe, com o botão de logout.

## Abandono no meio

`docs/user-flows.md` não tem jornada desta história, então os casos vêm dos critérios do PRD e de perguntar onde o fluxo pode quebrar:

- **Sessão que expira ou é invalidada com o app aberto.** A pessoa continua clicando e a API passa a responder 401. O front não pode mostrar erro técnico: leva ao login (CA7). O mesmo vale depois de um logout feito em outro dispositivo (CA8).
- **Rede que cai no envio do formulário.** A pessoa não sabe se a conta foi criada. O front mostra o erro e preserva o que foi digitado, para ela tentar de novo (CA10). Se o primeiro envio tinha chegado ao servidor, a nova tentativa cai no caso de e-mail já cadastrado (CA2); a pessoa então entra pelo login.
- **Clique duplo ou duas abas cadastrando o mesmo e-mail.** Só pode existir uma conta (CA9), garantido pela unicidade no banco e não por uma checagem que poderia perder a corrida.
- **Fechar a aba logo depois do cadastro.** Como o cadastro já autentica (CA1), ao reabrir dentro dos 7 dias a pessoa continua logada (CA5).

## Assume que

| Premissa | Issue que fecha |
|----------|-----------------|
| Nenhuma. | n/a             |

## Dúvidas em aberto

| # | Dúvida | Quem responde |
|---|--------|---------------|
