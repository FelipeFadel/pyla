import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('GET /plans e GET /plans/available (e2e)', () => {
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
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao(role: Role) {
    const res = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: 'senha1234' })
      .expect(201);
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0].split(
      ';',
    )[0];
    await prisma.user.update({
      where: { id: res.body.data.id as string },
      data: { role },
    });
    return cookie;
  }

  const criarPlano = (name: string, priceCents: number, active = true) =>
    prisma.plan.create({
      data: { name, nameKey: name.toLowerCase(), priceCents, active },
    });

  describe('GET /plans (gestão)', () => {
    it('admin recebe ativos e inativos em ordem alfabética sem diferenciar maiúsculas (CA1)', async () => {
      const cookie = await sessao(Role.ADMIN);
      await criarPlano('banana', 1990);
      await criarPlano('Abacaxi', 500, false);
      await criarPlano('cereja', 10000);

      const res = await server().get('/plans').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([
        {
          id: expect.any(String),
          name: 'Abacaxi',
          price: 5,
          active: false,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          id: expect.any(String),
          name: 'banana',
          price: 19.9,
          active: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          id: expect.any(String),
          name: 'cereja',
          price: 100,
          active: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]);
    });

    it('sem planos: data é lista vazia (CA1)', async () => {
      const cookie = await sessao(Role.ADMIN);

      const res = await server().get('/plans').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [] });
    });

    it('a resposta não vaza nameKey nem priceCents', async () => {
      const cookie = await sessao(Role.ADMIN);
      await criarPlano('Premium', 1000);

      const res = await server().get('/plans').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data[0].nameKey).toBeUndefined();
      expect(res.body.data[0].priceCents).toBeUndefined();
    });

    it('cliente: 403 (CA13)', async () => {
      const cookie = await sessao(Role.CUSTOMER);
      await criarPlano('Premium', 1000);

      const res = await server().get('/plans').set('Cookie', cookie);

      expect(res.status).toBe(403);
    });

    it('sem sessão: 401 (CA14)', async () => {
      const res = await server().get('/plans');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /plans/available', () => {
    async function semInativos(role: Role) {
      const cookie = await sessao(role);
      await criarPlano('banana', 1990);
      await criarPlano('Abacaxi', 500);
      await criarPlano('Inativo', 700, false);

      const res = await server()
        .get('/plans/available')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([
        { id: expect.any(String), name: 'Abacaxi', price: 5 },
        { id: expect.any(String), name: 'banana', price: 19.9 },
      ]);
    }

    it('cliente recebe só os ativos, em ordem alfabética, com id, nome e preço (CA9)', async () => {
      await semInativos(Role.CUSTOMER);
    });

    it('admin também recebe só os ativos (CA9)', async () => {
      await semInativos(Role.ADMIN);
    });

    it('sem planos ativos: data é lista vazia', async () => {
      const cookie = await sessao(Role.CUSTOMER);
      await criarPlano('Inativo', 700, false);

      const res = await server().get('/plans/available').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [] });
    });

    it('sem sessão: 401 (CA14)', async () => {
      const res = await server().get('/plans/available');

      expect(res.status).toBe(401);
    });
  });
});
