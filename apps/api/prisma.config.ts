import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// O CLI do Prisma não carrega o .env sozinho; o Node 24 carrega sem biblioteca extra.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // URL direta: só o CLI usa (migrations). A aplicação usa a DATABASE_URL pooled.
    url: process.env['DIRECT_URL'],
  },
});
