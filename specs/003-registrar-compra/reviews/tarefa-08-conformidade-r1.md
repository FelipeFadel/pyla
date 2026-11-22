# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA18: compra com itens, cada um com produto (nome e categoria), valores informados e valor com desconto, e soma dos itens, desconto de caixa e total | atendido | `apps/api/src/purchases/purchase-mapper.ts` (`toPurchaseDto`), `purchases.controller.ts` (`GET :id`), teste `apps/api/test/purchases-detail.e2e-spec.ts:90-153` |
| CA18: compra sem loja traz `store` nula e desconto de caixa 0 | atendido | `purchases-detail.e2e-spec.ts:155-164` |
| CA19: id inexistente e id de outro usuário dão 404 idêntico | atendido | `purchases.repository.ts` (`findConfirmedById`), `purchases.service.ts` (`findOne`), teste `purchases-detail.e2e-spec.ts:166-187` |
| RN07: rascunho dá 404 | atendido | filtro `status: 'CONFIRMED'` no repository, teste `purchases-detail.e2e-spec.ts:189-198` |
| id que não é UUID dá 400 | atendido | `dto/purchase-id-param.dto.ts`, teste `purchases-detail.e2e-spec.ts:200-206` |
| CA22: sem sessão dá 401 em `GET /purchases/:id` | atendido | guard global, teste `purchases-detail.e2e-spec.ts:86-88` |
| Regressão do POST com `product.category` | atendido | `purchases-create` passa. A resposta do POST e a do GET usam o mesmo `toPurchaseDto`, então o formato fica consistente. |

Testes rodados:
- `npm test`: 3 arquivos, 15 testes, todos passam.
- E2E de detail, create e list: 3 arquivos, 17 testes, todos passam.

## Sobre o `path` no 404 (CA19)
Satisfaz CA19. O filtro global (`apps/api/src/common/http-exception.filter.ts:89-90`) acrescenta só `path = request.url` e `timestamp`.

- **`path`:** repete exatamente o que o próprio chamador enviou, então não dá informação nova. Nos dois casos o corpo traz a mesma mensagem fixa, `'Compra não encontrada.'`. Não há como distinguir inexistente de alheia por esse campo.
- **`timestamp`:** varia a cada chamada e não depende de a compra existir.
- **Teste:** o `semEco` remove os dois campos e compara o resto com `toEqual`. O teste também confere que `path` é de fato o id pedido, então o eco não esconde outra coisa.
- **Paridade do caminho:** o repository filtra por `userId` e `CONFIRMED` na mesma query e devolve `null` nos dois casos. O service lança a mesma exceção. Não há ramo que diferencie os dois.

## Apontamentos
Nenhum.

## Observações
Nenhuma é bloqueante.

- O `GET :id` não ganhou uma asserção própria de `product.category` no teste do POST. A regressão do POST está coberta indiretamente: o formato é compartilhado e os testes de create passam.
- O refator do `POST` e do `list` (`toStoreRef`, `toPurchaseDto`) é interno e não muda contrato. Não conta como escopo inflado.
