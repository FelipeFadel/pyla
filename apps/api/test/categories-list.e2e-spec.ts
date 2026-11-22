import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const FIXED_CATEGORIES = [
  'Bebidas',
  'Carnes e peixes',
  'Congelados',
  'Higiene e beleza',
  'Hortifruti',
  'Laticínios e frios',
  'Limpeza',
  'Mercearia',
  'Outros',
  'Padaria',
];

describe('GET /categories (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao() {
    const res = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: 'senha1234' })
      .expect(201);
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  }

  it('usuário autenticado recebe as 10 categorias fixas em ordem alfabética (CA21)', async () => {
    const cookie = await sessao();

    const res = await server().get('/categories').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(
      FIXED_CATEGORIES,
    );
    for (const category of res.body.data) {
      expect(Object.keys(category).sort()).toEqual(['id', 'name']);
      expect(category.id).toEqual(expect.any(String));
    }
  });

  it('sem sessão: 401 (CA22)', async () => {
    const res = await server().get('/categories');

    expect(res.status).toBe(401);
  });
});
