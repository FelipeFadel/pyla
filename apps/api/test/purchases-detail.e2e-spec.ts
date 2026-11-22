import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('GET /purchases/:id (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
    const category = await prisma.category.findFirstOrThrow({
      where: { ownerId: null, name: 'Mercearia' },
    });
    categoryId = category.id;
  });

  async function limpar() {
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
  }

  beforeEach(limpar);

  afterAll(async () => {
    // FKs Restrict para User: não deixar sobra para os outros arquivos.
    await limpar();
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao(email: string) {
    const res = await server()
      .post('/auth/register')
      .send({ email, password: 'senha1234' })
      .expect(201);
    return {
      cookie: (res.headers['set-cookie'] as unknown as string[])[0].split(
        ';',
      )[0],
      userId: res.body.data.id as string,
    };
  }

  const comprar = async (cookie: string, body: object = {}) => {
    const res = await server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send({
        date: '2026-01-05',
        items: [
          {
            name: 'Arroz',
            categoryId,
            quantity: 1,
            packageSize: 1,
            unit: 'KG',
            fullPriceCents: 500,
          },
        ],
        ...body,
      })
      .expect(201);
    return res.body.data.id as string;
  };

  const consultar = (cookie: string, id: string) =>
    server().get(`/purchases/${id}`).set('Cookie', cookie);

  const idInexistente = '11111111-1111-4111-8111-111111111111';

  it('sem sessão: 401 (CA22)', async () => {
    await server().get(`/purchases/${idInexistente}`).expect(401);
  });

  it('devolve a compra com itens, produto, valores e totais (CA18)', async () => {
    const { cookie } = await sessao('a@x.com');
    const id = await comprar(cookie, {
      storeName: 'Mercado Bom',
      paidTotalCents: 1200,
      items: [
        {
          name: 'Arroz',
          categoryId,
          quantity: 2,
          packageSize: 5,
          unit: 'KG',
          fullPriceCents: 500,
          discountCents: 100,
        },
        {
          name: 'Feijão',
          categoryId,
          quantity: 1.5,
          packageSize: 1,
          unit: 'KG',
          fullPriceCents: 400,
        },
      ],
    });

    const res = await consultar(cookie, id);

    expect(res.status).toBe(200);
    const compra = res.body.data;
    expect(compra).toMatchObject({
      id,
      date: '2026-01-05',
      status: 'CONFIRMED',
      store: { id: expect.any(String), name: 'Mercado Bom' },
      itemsTotalCents: 1500,
      cashDiscountCents: 300,
      totalCents: 1200,
    });
    expect(compra.store).not.toHaveProperty('latitude');
    expect(compra.items).toHaveLength(2);
    const arroz = compra.items.find(
      (i: { product: { name: string } }) => i.product.name === 'Arroz',
    );
    expect(arroz).toEqual({
      id: expect.any(String),
      product: {
        id: expect.any(String),
        name: 'Arroz',
        categoryId,
        category: { id: categoryId, name: 'Mercearia' },
      },
      quantity: 2,
      packageSize: 5,
      unit: 'KG',
      fullPriceCents: 500,
      discountCents: 100,
      valueCents: 900,
    });
    const feijao = compra.items.find(
      (i: { product: { name: string } }) => i.product.name === 'Feijão',
    );
    expect(feijao.valueCents).toBe(600);
  });

  it('sem loja, store nula (CA18)', async () => {
    const { cookie } = await sessao('a@x.com');
    const id = await comprar(cookie);

    const res = await consultar(cookie, id);

    expect(res.status).toBe(200);
    expect(res.body.data.store).toBeNull();
    expect(res.body.data.cashDiscountCents).toBe(0);
  });

  it('id inexistente e id de outro usuário dão 404 com corpo idêntico (CA19)', async () => {
    const { cookie } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    const doOutro = await comprar(outro.cookie);

    const inexistente = await consultar(cookie, idInexistente);
    const alheia = await consultar(cookie, doOutro);

    expect(inexistente.status).toBe(404);
    expect(alheia.status).toBe(404);
    // O filtro global ecoa `path` (o que o próprio chamador pediu) e
    // `timestamp`; fora esses dois, o corpo é idêntico.
    const semEco = (corpo: Record<string, unknown>) => {
      const resto = { ...corpo };
      delete resto.path;
      delete resto.timestamp;
      return resto;
    };
    expect(semEco(alheia.body)).toEqual(semEco(inexistente.body));
    expect(alheia.body.path).toBe(`/purchases/${doOutro}`);
    expect(inexistente.body.path).toBe(`/purchases/${idInexistente}`);
  });

  it('compra em rascunho dá 404 (RN07)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const rascunho = await prisma.purchase.create({
      data: { userId, date: new Date('2026-02-01'), status: 'DRAFT' },
    });

    const res = await consultar(cookie, rascunho.id);

    expect(res.status).toBe(404);
  });

  it('id que não é UUID dá 400', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await consultar(cookie, 'nao-e-uuid');

    expect(res.status).toBe(400);
  });
});
