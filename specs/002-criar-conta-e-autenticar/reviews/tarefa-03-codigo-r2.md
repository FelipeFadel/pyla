# Parecer de Código — Tarefa 3 (rodada 2)

**Veredito:** APROVADO

Li `docs/architecture.md` e o diff completo contra `fe39bbb`, sem os arquivos em `specs/.../reviews` e sem o lockfile. Rodei `npm run lint` e `npm test`: os dois passaram sem avisos (1/1 no unit). O `test:e2e` passou 30/30 em uma execução. Veja a nota de flakiness abaixo.

## Apontamentos (bloqueiam)
Nenhum.

- **Camadas:**
  - O fluxo é controller → `AuthService` → `UsersService` → `UsersRepository` → `PrismaService`.
  - O controller não toca o Prisma e o service não importa o Prisma Client.
  - O `UsersModule` agora exporta só o `UsersService`, e o `AuthModule` usa o `UsersService`, não o repository. Isso cumpre §2.1: "um módulo só usa outro pelo service que esse outro exporta".
  - O `UsersService` é só repasse, mas a regra de módulos da §2.1 o exige, então não conta como indireção sem ganho.
- **Entrada da API:** `RegisterDto` está em `auth/dto/`. A whitelist e o `forbidNonWhitelisted` são cobertos pelo caso "campo extra" no e2e.
- **Resposta:** o controller devolve `{ id, email }` e o envelope `{ data }` vem do interceptor global. O `passwordHash` não vaza.
- **Segredos:** `JWT_SECRET` vem do `ConfigService.getOrThrow`, sem valor escrito no código.
- **Duplicação:** as constantes do cookie ficam em um único `session.constants.ts`.
- **Correção da r1:** `fileParallelism: false` é mínima e resolve a causa apontada, os arquivos e2e apagando a tabela `User` uns dos outros.
- **Testes:** verificam contrato observável (status, cookie, claims do JWT, banco). Não estão acoplados a detalhe de implementação.

## Sugestões (não bloqueiam)
Todas já foram vistas pelo usuário na r1 e continuam iguais:
- `secure` do cookie só em produção, contra a §2.1 ("`Secure` e `SameSite`"). Já registrado para a Atividade 15.
- Helper das opções do cookie quando o login chegar.
- Banco de teste separado do de desenvolvimento.
- `bcrypt` antes da checagem de duplicidade (CA2).

Sugestão nova, ligada à nota de flakiness abaixo: o `fileParallelism: false` só serializa dentro de um processo do vitest. O e2e continua frágil se duas execuções usarem o mesmo banco ao mesmo tempo (duas abas, dois revisores). A separação do banco de teste, já sugerida, é o que resolve isso de vez.

## Observações fora do escopo deste diff
- **Flakiness do e2e:** nesta revisão, 4 execuções seguidas do `test:e2e` deram resultados diferentes.
  - Três falharam: 29/30, 29/30 e 21/30.
  - Uma passou 30/30.
  - O teste que falhava mudava a cada vez, sempre com `User_email_key` violada (500) no log.
  - O enunciado avisava que o outro revisor usa o mesmo banco, e `a@x.com` é compartilhado entre as duas execuções.
  - Atribuo isso à execução concorrente de outro processo, não ao código da tarefa.
  - O que muda a conclusão: se aparecer falha de unicidade com uma única execução rodando, a correção da r1 é insuficiente e o veredito deveria ser revisto.
- **Duplicidade de e-mail:** hoje vira 500 no cadastro, porque o repository não trata o `P2002`. A §2.1 manda o filtro global traduzir `P2002` para 4xx. Isso é escopo do CA2 em tarefa futura. Convém confirmar que o `AllExceptionsFilter` já faz essa tradução.
