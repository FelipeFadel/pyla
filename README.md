# Pyla

Controle de gastos de mercado que registra a compra item a item e responde duas coisas:
para onde o dinheiro foi, por categoria e por loja, e qual produto compensa, pelo custo
por unidade e pelo histórico de preço.

Projeto da disciplina de Tópicos Especiais (UTFPR), desenvolvido com o método
[UTF-SDD](./CONTRIBUTING.md) — a IA escreve o código, as decisões passam por portões
humanos registrados.

## Autores

- Felipe Fadel — [@FelipeFadel](https://github.com/FelipeFadel)

## Stack

- Backend: NestJS, Prisma ORM e PostgreSQL
- Frontend: React, Vite, React Router e Tailwind CSS
- Testes e lint: Vitest e oxlint nas duas partes da aplicação
- Banco em produção: Neon
- Hospedagem: API no Render, web na Vercel
- Pagamento: Mercado Pago

Para um arquivo mais detalhado, vá para -> [`docs/architecture.md`](docs/architecture.md).

## Em produção

A partir da Entrega 3.

## Quick Start

Precisa de Node 24 ou mais novo e do Docker.

```bash
git clone https://github.com/FelipeFadel/pyla.git
cd pyla
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
npx -w apps/api prisma migrate deploy
npm run dev:api
npm run dev:web
```

| Comando | O que faz |
|---|---|
| `git clone ...` e `cd pyla` | Baixa o repositório e entra na pasta |
| `npm install` | Instala a API e o web de uma vez (npm workspaces) e gera o cliente do Prisma |
| `cp apps/api/.env.example apps/api/.env` | Cria o `.env` da API. Preencha os valores antes de seguir |
| `cp apps/web/.env.example apps/web/.env` | Cria o `.env` do web, com a URL da API |
| `docker compose up -d` | Sobe o PostgreSQL 18 local, com usuário e senha do `apps/api/.env` |
| `npx -w apps/api prisma migrate deploy` | Cria as tabelas no banco e as categorias fixas |
| `npm run dev:api` | Sobe a API em `http://localhost:3000`, com o Swagger em `/docs` |
| `npm run dev:web` | Sobe o web, em outro terminal |

Para rodar os testes: `npm test` (unitários) e `npm run test:e2e -w apps/api` (e2e, com o banco no ar).

## Documentação

| Documento                                      | O que responde                                                              |
|------------------------------------------------|-----------------------------------------------------------------------------|
| [docs/prd.md](docs/prd.md)                     | O que o produto faz: glossário, atores, 14 histórias e 23 regras de negócio |
| [docs/user-flows.md](docs/user-flows.md)       | O que a pessoa vive na tela e onde ela desiste                              |
| [docs/design-tokens.md](docs/design-tokens.md) | Paleta, espaçamento, tipografia e estados de botão                          |
| [docs/architecture.md](docs/architecture.md)   | Onde as coisas moram: stack, monorepo e diagrama ER                         |
| [docs/checklist.md](docs/checklist.md)         | O que a disciplina exige e o que já foi cumprido                            |
| [CONTRIBUTING.md](CONTRIBUTING.md)             | Como se trabalha aqui: fluxo Git, portões e ciclo de cada história          |

## Identidade visual

A paleta vem de caixas de feira — engradado azul, tomate, vagem, cítrico. O nome de cada
token diz o papel, nunca a cor: `primaria` continua verdadeiro se o azul mudar.

| Token      |           | Papel                                          |
|------------|-----------|------------------------------------------------|
| `primaria` | `#293379` | ação principal — confirmar compra, assinar     |
| `perigo`   | `#b81817` | erro de validação, excluir, pagamento recusado |
| `sucesso`  | `#607829` | compra confirmada, pagamento aprovado          |
| `atencao`  | `#e5a300` | selo premium e anel de foco de teclado         |

Tipografia **Saira Stencil One** nos títulos — a letra vazada com que se marca caixa de
feira — e **Saira** no corpo. Espaçamento em múltiplos de 4, uma progressão só.

Cada decisão está justificada em [docs/design-tokens.md](docs/design-tokens.md),
inclusive as que foram descartadas e por quê.

**Protótipo:** [Stitch](https://stitch.withgoogle.com/preview/14093580883373874346?node-id=494ddf8c28484334bdcaefcc21961c93)

## Estado do projeto

Fase 0 — planejamento. PRD, jornadas, tokens de design e arquitetura fechados; as
histórias `Ready` já estão como Issues no GitHub Projects. O código começa na Entrega 2.
