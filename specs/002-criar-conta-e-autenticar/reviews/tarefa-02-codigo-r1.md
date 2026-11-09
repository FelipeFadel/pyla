# Parecer de Código — Tarefa 2 (rodada 1)

**Veredito:** APROVADO

Rodei os testes. `test:e2e` passou com 12 testes em 3 arquivos, `npm test` passou, e `npm run lint` (oxlint) saiu sem erros. Os logs de erro com stack no e2e são o `Logger` do filtro registrando o erro do `/probe/boom`. Isso é esperado, e a resposta HTTP não vaza o texto.

## Apontamentos (bloqueiam)
Nenhum.

Conferido contra a §2.1 e a §3:
- **Pipe global:** tem `whitelist`, `forbidNonWhitelisted` e `transform`.
- **Envelope:** o interceptor global devolve `{ data }`.
- **Filtro global:** o formato do erro é `{ statusCode, error, message, details?, path, timestamp }`, com mensagens em português. Erro desconhecido vira 500 genérico, e a stack só vai para o log.
- **CORS:** aceita só `WEB_ORIGIN`, com credentials.
- **Boot:** falha sem as variáveis obrigatórias. `.env.example` tem só nomes, sem valores.
- **Segredos:** não há segredo nem URL de ambiente no código.
- **Camadas:** não há violação, porque o diff não toca controller, service nem repository.

## Sugestões (não bloqueiam)
- **Mensagem própria some com exceção embutida do Nest** — `apps/api/src/common/http-exception.filter.ts` (`customPart`).
  - `customPart` descarta o corpo de qualquer exceção que tenha `statusCode`. Isso inclui `new ConflictException('E-mail já cadastrado')`, que sai com o texto genérico "Conflito com o estado atual.".
  - Só o formato `new XException({ message, details })`, sem `statusCode`, preserva o texto.
  - A Tarefa 3 vai precisar da mensagem do e-mail duplicado. Registre a convenção na spec ou no plano da próxima tarefa.
  - Vale também um teste e2e que fixe esse comportamento. Hoje o teste só cobre `BadRequestException` com `details` e o 404.
- **`P2002` ainda não é traduzido** — mesmo arquivo. A §2.1 diz que o filtro traduz erros conhecidos do Prisma, como `P2002`, para 4xx. O diff não faz isso, e não é exigido pelos 4 testes da Tarefa 2. Se a Tarefa 3 tratar a unicidade do e-mail no service, está ok. Caso contrário, `P2002` vira 500.
- **Duplicação da validação de env no teste** — `apps/api/test/base-global.e2e-spec.ts`. O describe de boot cobre o `validateEnv` pelo `AppModule` real, o que é bom. Falta um teste unitário `env.validation.spec.ts` ao lado do arquivo (a §3 manda o teste ficar ao lado do código). Isso é barato e deixa o e2e mais enxuto.
- **Teste de 500 acoplado a texto** — `expect(texto).not.toContain(' at ')` e `'select'` são frágeis. Eles passam hoje, mas um `message` futuro que contenha " at " quebraria sem haver vazamento. Basta checar que `message` é igual ao texto padrão e que não existe a chave `stack`.

## Observações fora do escopo deste diff
- `cookie-parser` e `@types/cookie-parser` estão instalados e registrados na §2, mas nada o usa ainda (`app.use(cookieParser())` não existe em `configureApp`). A tarefa do `JwtAuthGuard` precisa registrá-lo em `setup-app.ts`, senão os e2e passam e o `main.ts` real não lê o cookie.
- A §3 diz que o `main.ts` faz o bootstrap de ValidationPipe, Swagger, CORS, filtro e interceptor. A configuração agora vive em `common/setup-app.ts`, chamada pelo `main.ts`. Isso é razoável (os e2e reusam a mesma função), mas o texto da §3 e da §2.1 ("em `main.ts`") fica levemente defasado. Se quiser, abra Issue de manutenção para atualizar o documento.
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` e `DIRECT_URL` não estão em `REQUIRED_VARIABLES`. Isso é correto por ora, mas a lista deve crescer nas tarefas de pagamento.
