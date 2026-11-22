# Parecer de Código — Tarefa 6

**Veredito:** APROVADO

`npm test` em apps/api: 3 arquivos e 15 testes passaram. Não rodei o e2e, como pedido.

## Apontamentos (bloqueiam)
Nenhum.

## Sugestões (não bloqueiam)

1. **PurchasesRepository lê `Category` direto (ponto 1). Classifico como sugestão, não violação.**
   - A regra do §2.1 diz que um módulo "só usa outro pelo service que esse outro exporta, nunca pelo repository nem por arquivo interno". Aqui não há import do repository nem de arquivo interno de `categories`. A leitura passa pelo `PrismaService`, dentro do repository do próprio módulo, que é o lugar permitido para chamar o Prisma (`purchases.repository.ts`, `findFixedCategoryIds`).
   - A letra da regra não é quebrada, mas o espírito é: `purchases` passa a conhecer a tabela de outro domínio e repete o critério "fixa = `ownerId: null`".
   - Esse critério já mora em `CategoriesRepository.findAllFixed` (`categories.repository.ts`). Se mudar, por exemplo para `archivedAt`, há dois lugares para lembrar.
   - O caminho mais limpo é `CategoriesModule` exportar `CategoriesService` com um método como `findFixedIds(ids)`, e `purchases` injetar esse service. Isso custa um `exports` e um método.
   - Se o usuário preferir manter como está, vale registrar a decisão no plan. Hoje `CategoriesModule` não exporta nada.

2. **Validação inline no `create` do service (ponto 3).**
   - `create` tem cerca de 100 linhas, com seis blocos de validação em sequência. Ainda lê bem, mas a próxima tarefa (rascunho/confirmação reaproveitando a validação) vai pesar.
   - `nameProblem` e `isRealDate` já são funções puras no topo do arquivo. Mover essas e as checagens de desconto e total para um `purchase-validation.ts`, no mesmo molde de `purchase-calculations.ts`, deixaria o service só orquestrando.
   - Não vejo prejuízo hoje, então não bloqueia.

3. **Cobertura unitária ausente para lógica nova.**
   - `IsMilliNumber`, `dateInSaoPaulo` e `isRealDate` só são exercitados pelo e2e. O padrão de `common/normalize-name.spec.ts` pede spec ao lado do arquivo.
   - O `IsMilliNumber` merece spec própria porque a razão de existir é o bug de notação exponencial (1e-7), e esse caso é de unidade pura. O `npm test` roda em 1 s, ao contrário do e2e.

4. **`IsMilliNumber` (ponto 4).**
   - A correção está certa e o comentário explica o porquê. Cobertos no e2e: 1e-7, 1e21, 4 casas, texto, 0, negativo e os limites.
   - Há uma folga: a tolerância de 1e-6 sobre `value*1000` deixa passar valores como 0.0010000001, que o `Decimal(12,3)` arredondaria sem avisar. Em 1e-10, o `Min(0.001)` pega. É um caso de borda sem prejuízo prático para a spec.

5. **`Clock` e `dateInSaoPaulo` (ponto 2).**
   - O design é adequado: provider concreto em `common/`, função pura exportada, e `Intl` com `timeZone` correto. Os testes de meia-noite de São Paulo usam instantes literais, o que é bom.
   - Se outro módulo precisar do relógio, `Clock` vai ter de entrar nos `providers` dele. Aí vale um `ClockModule` global.
   - `en-CA` dá `YYYY-MM-DD` por convenção de ICU. Funciona no Node 24 com full-icu, mas é uma dependência implícita. O teste de meia-noite protege contra regressão.

6. **E2E com `overrideProvider(Clock)` (ponto 6).**
   - Funciona mesmo com o `Clock` provido em `PurchasesModule`, porque o override é global na árvore de módulos de teste.
   - O helper `hoje()` do teste reimplementa o `Intl.DateTimeFormat` da produção. Importar `dateInSaoPaulo` evitaria duplicar a regra.
   - O `now` mutável em closure é aceitável, porque é resetado no `beforeEach`.

## Pontos checados sem achado
- **Ponto 5, caminhos de 500.**
  - NUL e surrogate solto são barrados antes do `normalizeName`.
  - `normalizedName` vazio vira 400.
  - A data passa por regex, depois por `isRealDate` (calendário, ano ≥ 1900) e depois pela checagem de futuro.
  - Quantidade e tamanho de embalagem têm limites que cabem no `Decimal(12,3)`, e `fullPriceCents` e `discountCents` ficam dentro do `Int`.
  - `items` com `null`, número ou texto é recusado pelo pipe.
  - A categoria é verificada antes da transação.
  - O valor cheio do item pode passar de `INT_MAX`, mas não é persistido e a soma cabe no número seguro de JS.
- **Ponto 7, regressão nas tarefas 3 a 5.**
  - As mensagens de `storeId` e `productId` passaram de string para objeto com `details`, e o `AllExceptionsFilter.customPart` trata esse formato.
  - Os e2e antigos (`purchases-store`, `purchases-products`) só conferem o status 400 e que nada foi gravado, não o texto. Sem quebra.
- A resposta de erro segue o formato global, e a mensagem sai em português.

## Observações fora do escopo deste diff
- Nenhuma nova. O `limpar()` do e2e apaga todos os usuários do banco compartilhado, mas segue o padrão dos outros e2e.
