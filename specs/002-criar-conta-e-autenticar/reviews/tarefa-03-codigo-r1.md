# Parecer de Código — Tarefa 3 (rodada 1)

**Veredito:** APONTAMENTOS (equivale a REPROVADO)

Rodei `npm test` (passou) e `npm run lint` (limpo). `npm run test:e2e` é instável: em 3 das 7 primeiras execuções falharam 1 ou 2 testes de `auth-register`. Em duas dessas execuções o outro revisor pode ter rodado a suíte ao mesmo tempo no mesmo banco, o que não consigo descartar. Mesmo assim o código tem uma causa própria, descrita no apontamento 1. Nas 8 execuções seguintes (3 com a saída filtrada por FAIL e 5 em sequência), todos os 30 testes passaram.

## Apontamentos (bloqueiam)

1. **Dois arquivos e2e rodam em paralelo contra a mesma tabela `User` e se apagam mutuamente. O resultado é teste intermitente.**
   - Evidência: `apps/api/test/auth-register.e2e-spec.ts:25-27` faz `prisma.user.deleteMany()` no `beforeEach`. `apps/api/src/users/users.repository.e2e-spec.ts:22-24` (Tarefa 1) faz o mesmo.
   - O `vitest.config.e2e.ts` inclui `**/*.e2e-spec.ts` com `root: './'`, então os dois arquivos entram na suíte e o Vitest os executa em workers paralelos.
   - Falhas vistas: `expect(await prisma.user.count()).toBe(0)` (`auth-register.e2e-spec.ts:194`) e `expected 'a@x.com' to be 'ana@x.com'` no teste de normalização. Também falharam "o JWT do cookie tem sub e tokenVersion" e "aceita senha acentuada". Cada uma é um usuário de um arquivo aparecendo ou sumindo no outro.
   - Esta tarefa introduziu o segundo arquivo que mexe em `User`. Antes dela só existia o da Tarefa 1.
   - Regra violada: o §7 do architecture.md exige `npm run test:e2e` verde no CI, e "PR vermelho não mescla". Teste que depende de ordem ou de timing não serve como prova na defesa.
   - Prejuízo concreto: o CI vai falhar de forma aleatória no PR e na defesa, sem relação com defeito de código. As tarefas seguintes (login, logout, guard) vão acrescentar mais e2e na mesma tabela e piorar isso.
   - Saídas possíveis, a decidir na triagem: executar os e2e sem paralelismo entre arquivos (`fileParallelism: false` no `vitest.config.e2e.ts`), ou isolar os dados por arquivo (e-mails únicos por teste e limpeza só do que o teste criou, sem `deleteMany` global).

## Sugestões (não bloqueiam)

- **Cookie `Secure` condicionado a `NODE_ENV === 'production'`** (`auth.controller.ts:24`). O §2.1 pede cookie `httpOnly`, `Secure` e `SameSite`. A spec adia o ajuste do `SameSite` para o deploy, então `lax` é aceitável agora. Vale deixar a decisão de `Secure` e `SameSite` registrada para a Atividade 15, porque com web e API em domínios diferentes `lax` impede o envio do cookie.
- **Opções do cookie no controller.** Quando o login (Tarefa 4) emitir o mesmo cookie, as opções serão duplicadas. Extrair um helper ao lado de `session.constants.ts` só faz sentido quando o segundo uso existir. Não crie antes.
- **`UsersService.create` é só repasse** para o repository. Está correto, porque o §2.1 obriga usar outro módulo pelo service. Não é abstração a remover.
- **`deleteMany()` global em banco que também é o de desenvolvimento local.** Rodar o e2e apaga os usuários de quem estiver testando à mão. Considere um banco de teste separado.
- **Ordem no `register`:** o `bcrypt` com 12 rodadas roda antes de qualquer verificação de e-mail duplicado. O custo só aparece quando o CA2 for implementado.

## Observações fora do escopo deste diff

- Ainda não há tradução de `P2002` para 4xx no `AllExceptionsFilter` (o grep só achou `P2002` no teste de repository). O e-mail duplicado (CA2) cairia em 500 hoje. Presumo que seja de outra tarefa do plano, mas confirme que alguma tarefa cobre isso.
- `JwtModule` não é global nem exporta nada de `AuthModule`. O `JwtAuthGuard` global (`APP_GUARD`) e o `@Public()` do §2.1 ainda não existem. Hoje a rota de cadastro funciona sem `@Public()` só porque não há guard. Isso precisa entrar junto com o guard, senão o cadastro vira 401.

Arquivos relevantes:
- C:\Users\Usuário\pyla\apps\api\vitest.config.e2e.ts
- C:\Users\Usuário\pyla\apps\api\test\auth-register.e2e-spec.ts
- C:\Users\Usuário\pyla\apps\api\src\users\users.repository.e2e-spec.ts
- C:\Users\Usuário\pyla\apps\api\src\auth\auth.controller.ts
