import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('POST /plans (e2e)', () => {
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

  const criar = (cookie: string, body: Record<string, unknown>) =>
    server().post('/plans').set('Cookie', cookie).send(body);

  it('admin cria o plano: 201, nome sem espaços nas pontas e ativo (CA2)', async () => {
    const cookie = await sessao(Role.ADMIN);

    const res = await criar(cookie, { name: '  Premium  ', price: 19.9 });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({
      id: expect.any(String),
      name: 'Premium',
      price: 19.9,
      active: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    const gravado = await prisma.plan.findMany();
    expect(gravado).toHaveLength(1);
    expect(gravado[0].name).toBe('Premium');
    expect(gravado[0].priceCents).toBe(1990);
    expect(gravado[0].active).toBe(true);
  });

  it('converte o preço em centavos sem erro de ponto flutuante', async () => {
    const cookie = await sessao(Role.ADMIN);

    const res = await criar(cookie, { name: 'A', price: 1.15 });

    expect(res.status).toBe(201);
    expect(res.body.data.price).toBe(1.15);
    expect((await prisma.plan.findFirstOrThrow()).priceCents).toBe(115);
  });

  it('aceita os limites: 0.01 e 9999.99, nome de 60 caracteres', async () => {
    const cookie = await sessao(Role.ADMIN);

    await criar(cookie, { name: 'a'.repeat(60), price: 0.01 }).expect(201);
    await criar(cookie, { name: 'b', price: 9999.99 }).expect(201);
  });

  it('a resposta não vaza nameKey nem priceCents', async () => {
    const cookie = await sessao(Role.ADMIN);

    const res = await criar(cookie, { name: 'Premium', price: 10 });

    expect(res.body.data.nameKey).toBeUndefined();
    expect(res.body.data.priceCents).toBeUndefined();
  });

  describe('validação (CA3): 400 indicando o campo e nada gravado', () => {
    const casos: [string, Record<string, unknown>, string][] = [
      ['nome vazio', { name: '', price: 10 }, 'name'],
      ['nome só com espaços', { name: '   ', price: 10 }, 'name'],
      ['nome ausente', { price: 10 }, 'name'],
      ['nome com 61 caracteres', { name: 'a'.repeat(61), price: 10 }, 'name'],
      [
        'nome com 61 caracteres só pelo espaço interno',
        { name: ` ${'a'.repeat(61)} `, price: 10 },
        'name',
      ],
      ['nome que não é texto', { name: 123, price: 10 }, 'name'],
      ['preço em texto', { name: 'A', price: 'dez' }, 'price'],
      ['preço numérico em texto', { name: 'A', price: '10' }, 'price'],
      ['preço ausente', { name: 'A' }, 'price'],
      ['preço nulo', { name: 'A', price: null }, 'price'],
      ['preço zero', { name: 'A', price: 0 }, 'price'],
      ['preço negativo', { name: 'A', price: -1 }, 'price'],
      ['preço acima do máximo', { name: 'A', price: 10000 }, 'price'],
      ['preço 9999.995', { name: 'A', price: 9999.995 }, 'price'],
      ['preço com 3 casas', { name: 'A', price: 1.234 }, 'price'],
      ['preço NaN', { name: 'A', price: 'NaN' }, 'price'],
    ];

    it.each(casos)('%s', async (_nome, body, campo) => {
      const cookie = await sessao(Role.ADMIN);

      const res = await criar(cookie, body);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          { field: campo, messages: expect.any(Array) },
        ]),
      );
      expect(await prisma.plan.count()).toBe(0);
    });

    it('campo extra no corpo (ex.: active, nameKey) é recusado', async () => {
      const cookie = await sessao(Role.ADMIN);

      const res = await criar(cookie, {
        name: 'A',
        price: 10,
        nameKey: 'x',
      });

      expect(res.status).toBe(400);
      expect(await prisma.plan.count()).toBe(0);
    });
  });

  describe('nome repetido (CA4): 409 apontando o nome', () => {
    it('mesmo nome com outras maiúsculas e espaços nas pontas', async () => {
      const cookie = await sessao(Role.ADMIN);
      await criar(cookie, { name: 'Premium', price: 10 }).expect(201);

      const res = await criar(cookie, { name: '  pREMIUM ', price: 20 });

      expect(res.status).toBe(409);
      expect(res.body.statusCode).toBe(409);
      expect(res.body.message.toLowerCase()).toContain('nome');
      expect(res.body.details).toEqual([
        { field: 'name', messages: expect.any(Array) },
      ]);
      const texto = JSON.stringify(res.body).toLowerCase();
      for (const vazamento of ['p2002', 'prisma', 'constraint', 'namekey']) {
        expect(texto).not.toContain(vazamento);
      }
      const gravados = await prisma.plan.findMany();
      expect(gravados).toHaveLength(1);
      expect(gravados[0].priceCents).toBe(1000);
    });
  });

  it('duas criações simultâneas com o mesmo nome: um 201 e um 409 (CA5)', async () => {
    const cookie = await sessao(Role.ADMIN);

    const [r1, r2] = await Promise.all([
      criar(cookie, { name: 'Premium', price: 10 }),
      criar(cookie, { name: ' PREMIUM', price: 10 }),
    ]);

    expect([r1.status, r2.status].sort((a, b) => a - b)).toEqual([201, 409]);
    const recusada = r1.status === 409 ? r1 : r2;
    expect(recusada.body.message.toLowerCase()).toContain('nome');
    expect(await prisma.plan.count()).toBe(1);
  });

  it('cliente: 403 e nada gravado (CA13)', async () => {
    const cookie = await sessao(Role.CUSTOMER);

    const res = await criar(cookie, { name: 'Premium', price: 10 });

    expect(res.status).toBe(403);
    expect(await prisma.plan.count()).toBe(0);
  });

  it('sem sessão: 401 (CA14)', async () => {
    const res = await server()
      .post('/plans')
      .send({ name: 'Premium', price: 10 });

    expect(res.status).toBe(401);
    expect(await prisma.plan.count()).toBe(0);
  });
});
