import 'dotenv/config';
import { defineConfig } from 'prisma/config';

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
