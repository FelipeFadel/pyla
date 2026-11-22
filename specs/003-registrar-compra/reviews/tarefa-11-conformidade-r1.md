# Parecer de Conformidade — Tarefa 11

**Veredito:** APROVADO

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| CA5 e CA9: 404 de POST /purchases documentado no Swagger | atendido | `apps/api/src/purchases/purchases.controller.ts:42-47` (@ApiResponse 404 com ErrorResponseDto) |
| Teste prova o 404 no /docs-json | atendido | `apps/api/test/swagger.e2e-spec.ts:189-191` lê `doc.paths['/purchases'].post.responses['404']` do documento gerado; a asserção é `toBeDefined`, suficiente para provar a presença |
| TODOs do "Assume que" sem número de Issue, só comentário | atendido | `apps/api/prisma/schema.prisma:77` (latitude/longitude); `apps/api/src/purchases/purchases.repository.ts:118-119` (rascunho e base coletiva) |
| Nenhuma mudança de comportamento no item (b) | atendido | O diff de schema.prisma e repository.ts só tem linhas de comentário |
| Nada além disso no diff | atendido | Fora do plan.md, só os 4 arquivos previstos mudaram |
| Testes | atendido | `npm test`: 15 passam. `swagger.e2e-spec.ts`: 21 passam, incluindo o teste do 404 e o teste dos schemas exatos |

## Apontamentos
Nenhum.

Observações não bloqueantes:
- O texto do plan.md da Tarefa 11 ainda diz `TODO #<n>` e "Depende de: o usuário abrir as 3 Issues". Isso diverge da versão mínima pedida, que deixa os TODOs sem número. Não afeta o código.
- Não confirmei que o teste falhava antes da mudança (o RED). Só rodei o estado atual. O plan.md afirma que os 404 estavam ausentes, e o diff confirma que a anotação foi adicionada junto com o teste.
