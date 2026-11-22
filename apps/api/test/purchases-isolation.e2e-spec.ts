import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Isolamento entre usuários (e2e, CA23, RN21)', () => {
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

  const item = (name: string) => ({
    name,
    categoryId,
    quantity: 1,
    packageSize: 1,
    unit: 'KG',
    fullPriceCents: 500,
  });

  const comprar = (cookie: string, body: object) =>
    server().post('/purchases').set('Cookie', cookie).send(body);

  // Cada usuário: duas compras, produto "Arroz" (mesmo nome nos dois), um
  // produto só dele e uma loja só dele, além de uma loja de mesmo nome.
  async function cenario() {
    const a = await sessao('a@x.com');
    const b = await sessao('b@x.com');
    const a1 = await comprar(a.cookie, {
      date: '2026-01-05',
      storeName: 'Loja da A',
      items: [item('Arroz'), item('Feijão da A')],
    }).expect(201);
    const a2 = await comprar(a.cookie, {
      date: '2026-01-06',
      storeName: 'Mercado Comum',
      items: [item('Arroz')],
    }).expect(201);
    const b1 = await comprar(b.cookie, {
      date: '2026-01-07',
      storeName: 'Loja do B',
      items: [item('Arroz'), item('Macarrão do B')],
    }).expect(201);
    const b2 = await comprar(b.cookie, {
      date: '2026-01-08',
      storeName: 'Mercado Comum',
      items: [item('Arroz')],
    }).expect(201);
    return {
      a,
      b,
      idsA: [a1.body.data.id, a2.body.data.id] as string[],
      idsB: [b1.body.data.id, b2.body.data.id] as string[],
    };
  }

  it('o produto de mesmo nome dos dois usuários são dois registros distintos', async () => {
    const { a, b } = await cenario();

    const arrozes = await prisma.product.findMany({
      where: { normalizedName: 'arroz' },
    });

    expect(arrozes).toHaveLength(2);
    expect(new Set(arrozes.map((p) => p.id)).size).toBe(2);
    expect(arrozes.map((p) => p.userId).sort()).toEqual(
      [a.userId, b.userId].sort(),
    );
    const lojasComuns = await prisma.store.findMany({
      where: { normalizedName: 'mercado comum' },
    });
    expect(lojasComuns).toHaveLength(2);
    expect(lojasComuns.map((l) => l.userId).sort()).toEqual(
      [a.userId, b.userId].sort(),
    );
  });

  it('GET /purchases mostra só as compras de cada um', async () => {
    const { a, b, idsA, idsB } = await cenario();

    const daA = await server().get('/purchases').set('Cookie', a.cookie);
    const daB = await server().get('/purchases').set('Cookie', b.cookie);

    expect(daA.status).toBe(200);
    expect(daA.body.data.map((c: { id: string }) => c.id)).toEqual(
      [...idsA].reverse(),
    );
    expect(daB.body.data.map((c: { id: string }) => c.id)).toEqual(
      [...idsB].reverse(),
    );
    const lojasA = daA.body.data.map(
      (c: { store: { name: string } }) => c.store.name,
    );
    expect(lojasA).not.toContain('Loja do B');
    expect(JSON.stringify(daA.body)).not.toContain('Loja do B');
    expect(JSON.stringify(daB.body)).not.toContain('Loja da A');
  });

  it('GET /purchases/:id do outro dá 404 e o próprio dá 200 com o produto do dono', async () => {
    const { a, b, idsA, idsB } = await cenario();

    for (const id of idsB) {
      await server()
        .get(`/purchases/${id}`)
        .set('Cookie', a.cookie)
        .expect(404);
    }
    for (const id of idsA) {
      await server()
        .get(`/purchases/${id}`)
        .set('Cookie', b.cookie)
        .expect(404);
    }

    const propria = await server()
      .get(`/purchases/${idsA[0]}`)
      .set('Cookie', a.cookie);
    expect(propria.status).toBe(200);
    const nomes = propria.body.data.items.map(
      (i: { product: { name: string } }) => i.product.name,
    );
    expect(nomes.sort()).toEqual(['Arroz', 'Feijão da A']);
    const arrozDeA = await prisma.product.findFirstOrThrow({
      where: { userId: a.userId, normalizedName: 'arroz' },
    });
    const itemArroz = propria.body.data.items.find(
      (i: { product: { name: string } }) => i.product.name === 'Arroz',
    );
    expect(itemArroz.product.id).toBe(arrozDeA.id);
  });

  it('GET /products?search= mostra só os produtos de cada um', async () => {
    const { a, b } = await cenario();
    const arrozes = await prisma.product.findMany({
      where: { normalizedName: 'arroz' },
    });
    const arrozA = arrozes.find((p) => p.userId === a.userId)!;
    const arrozB = arrozes.find((p) => p.userId === b.userId)!;

    const buscaA = await server()
      .get('/products')
      .query({ search: 'arroz' })
      .set('Cookie', a.cookie);
    const buscaB = await server()
      .get('/products')
      .query({ search: 'arroz' })
      .set('Cookie', b.cookie);

    expect(buscaA.body.data.map((p: { id: string }) => p.id)).toEqual([
      arrozA.id,
    ]);
    expect(buscaB.body.data.map((p: { id: string }) => p.id)).toEqual([
      arrozB.id,
    ]);

    const doOutro = await server()
      .get('/products')
      .query({ search: 'do b' })
      .set('Cookie', a.cookie);
    expect(doOutro.status).toBe(200);
    expect(doOutro.body.data).toEqual([]);
    const todosB = await server()
      .get('/products')
      .query({ search: 'o' })
      .set('Cookie', b.cookie);
    expect(
      todosB.body.data.map((p: { name: string }) => p.name).sort(),
    ).toEqual(['Arroz', 'Macarrão do B']);
  });

  it('POST com productId de outro usuário dá 404 e nada é gravado', async () => {
    const { a, b } = await cenario();
    const produtoB = await prisma.product.findFirstOrThrow({
      where: { userId: b.userId, normalizedName: 'macarrao do b' },
    });
    const antes = {
      compras: await prisma.purchase.count(),
      itens: await prisma.purchaseItem.count(),
      produtos: await prisma.product.count(),
      lojas: await prisma.store.count(),
    };

    const res = await comprar(a.cookie, {
      date: '2026-01-09',
      storeName: 'Loja Nova da A',
      items: [
        {
          productId: produtoB.id,
          quantity: 1,
          packageSize: 1,
          unit: 'KG',
          fullPriceCents: 500,
        },
      ],
    });

    expect(res.status).toBe(404);
    expect({
      compras: await prisma.purchase.count(),
      itens: await prisma.purchaseItem.count(),
      produtos: await prisma.product.count(),
      lojas: await prisma.store.count(),
    }).toEqual(antes);
  });

  it('POST com storeId de outro usuário dá 404 e nada é gravado', async () => {
    const { a, b } = await cenario();
    const lojaB = await prisma.store.findFirstOrThrow({
      where: { userId: b.userId, normalizedName: 'loja do b' },
    });
    const antes = {
      compras: await prisma.purchase.count(),
      itens: await prisma.purchaseItem.count(),
      produtos: await prisma.product.count(),
    };

    const res = await comprar(a.cookie, {
      date: '2026-01-09',
      storeId: lojaB.id,
      items: [item('Produto Novo da A')],
    });

    expect(res.status).toBe(404);
    expect({
      compras: await prisma.purchase.count(),
      itens: await prisma.purchaseItem.count(),
      produtos: await prisma.product.count(),
    }).toEqual(antes);
    expect(await prisma.purchase.count({ where: { storeId: lojaB.id } })).toBe(
      1,
    );
  });
});
