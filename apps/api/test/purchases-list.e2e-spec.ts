import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('GET /purchases (e2e)', () => {
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

  const comprar = async (cookie: string, body: object) => {
    const res = await server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send({
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

  const listar = (cookie: string) =>
    server().get('/purchases').set('Cookie', cookie);

  it('sem sessão: 401 (CA22)', async () => {
    await server().get('/purchases').expect(401);
  });

  it('sem compras devolve lista vazia (CA17)', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await listar(cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('devolve só as do usuário, com loja, total e quantidade de itens (CA17)', async () => {
    const { cookie } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    await comprar(outro.cookie, { date: '2026-01-10' });
    const id = await comprar(cookie, {
      date: '2026-01-05',
      storeName: 'Mercado Bom',
      paidTotalCents: 1200,
      items: [
        {
          name: 'Arroz',
          categoryId,
          quantity: 2,
          packageSize: 1,
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

    const res = await listar(cookie);

    expect(res.status).toBe(200);
    // itens: 900 + 600 = 1500; total pago 1200.
    expect(res.body.data).toEqual([
      {
        id,
        date: '2026-01-05',
        store: { id: expect.any(String), name: 'Mercado Bom' },
        totalCents: 1200,
        itemsCount: 2,
      },
    ]);
  });

  it('sem total pago, o total é a soma dos itens; sem loja, store nula (CA17)', async () => {
    const { cookie } = await sessao('a@x.com');
    await comprar(cookie, { date: '2026-01-05' });

    const res = await listar(cookie);

    expect(res.body.data[0].store).toBeNull();
    expect(res.body.data[0].totalCents).toBe(500);
    expect(res.body.data[0].itemsCount).toBe(1);
  });

  it('ordena da data mais recente para a mais antiga e, na mesma data, a criada depois vem primeiro (CA17)', async () => {
    const { cookie } = await sessao('a@x.com');
    const antiga = await comprar(cookie, { date: '2026-01-01' });
    const novaPrimeira = await comprar(cookie, { date: '2026-03-01' });
    const mesmaDia1 = await comprar(cookie, { date: '2026-02-01' });
    const mesmaDia2 = await comprar(cookie, { date: '2026-02-01' });
    const mesmaDia3 = await comprar(cookie, { date: '2026-02-01' });

    const res = await listar(cookie);

    expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([
      novaPrimeira,
      mesmaDia3,
      mesmaDia2,
      mesmaDia1,
      antiga,
    ]);
  });

  it('não lista compra em rascunho (RN07)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const id = await comprar(cookie, { date: '2026-01-05' });
    await prisma.purchase.create({
      data: { userId, date: new Date('2026-02-01'), status: 'DRAFT' },
    });

    const res = await listar(cookie);

    expect(res.body.data.map((p: { id: string }) => p.id)).toEqual([id]);
  });
});
