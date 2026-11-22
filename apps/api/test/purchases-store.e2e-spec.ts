import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
}

describe('POST /purchases: loja (e2e)', () => {
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

  const item = {
    name: 'Arroz',
    quantity: 1,
    packageSize: 1,
    unit: 'KG',
    fullPriceCents: 500,
  };

  const post = (cookie: string, extra: object) =>
    server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send({
        date: todaySaoPaulo(),
        items: [{ ...item, categoryId }],
        ...extra,
      });

  const lojaDe = (userId: string, name: string) =>
    prisma.store.create({
      data: { userId, name, normalizedName: name.trim().toLowerCase() },
    });

  it('storeId de loja do usuário liga a compra a ela (CA7)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const store = await lojaDe(userId, 'Mercado Bom');

    const res = await post(cookie, { storeId: store.id });

    expect(res.status).toBe(201);
    expect(res.body.data.store).toEqual({ id: store.id, name: 'Mercado Bom' });
    const saved = await prisma.purchase.findFirstOrThrow({ where: { userId } });
    expect(saved.storeId).toBe(store.id);
    expect(await prisma.store.count()).toBe(1);
  });

  it('storeName cria a loja quando não existe (CA7)', async () => {
    const { cookie, userId } = await sessao('a@x.com');

    const res = await post(cookie, { storeName: '  Mercado Novo ' });

    expect(res.status).toBe(201);
    expect(res.body.data.store.name).toBe('Mercado Novo');
    const stores = await prisma.store.findMany({ where: { userId } });
    expect(stores).toHaveLength(1);
    expect(res.body.data.store.id).toBe(stores[0].id);
    const saved = await prisma.purchase.findFirstOrThrow({ where: { userId } });
    expect(saved.storeId).toBe(stores[0].id);
  });

  it('storeName reaproveita a loja existente, sem duplicar (CA7)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const store = await lojaDe(userId, 'mercado bom');

    const res = await post(cookie, { storeName: '  MERCADO   Bom ' });

    expect(res.status).toBe(201);
    expect(res.body.data.store.id).toBe(store.id);
    expect(await prisma.store.count()).toBe(1);
  });

  it('o mesmo nome de loja em outro usuário cria loja própria (CA7)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    const alheia = await lojaDe(outro.userId, 'mercado bom');

    const res = await post(cookie, { storeName: 'Mercado Bom' });

    expect(res.status).toBe(201);
    expect(res.body.data.store.id).not.toBe(alheia.id);
    expect(await prisma.store.count({ where: { userId } })).toBe(1);
    expect(await prisma.store.count()).toBe(2);
  });

  it('duas compras simultâneas com a mesma loja nova deixam uma só loja (CA7)', async () => {
    const { cookie, userId } = await sessao('a@x.com');

    const [r1, r2] = await Promise.all([
      post(cookie, { storeName: 'Atacado' }),
      post(cookie, { storeName: ' atacado' }),
    ]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(await prisma.store.count({ where: { userId } })).toBe(1);
  });

  it('storeId inexistente: 404 e nada é gravado (CA9)', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, {
      storeId: '00000000-0000-4000-8000-000000000000',
    });

    expect(res.status).toBe(404);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
  });

  it('storeId de outro usuário: 404 e nada é gravado (CA9)', async () => {
    const { cookie } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    const alheia = await lojaDe(outro.userId, 'alheia');

    const res = await post(cookie, { storeId: alheia.id });

    expect(res.status).toBe(404);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.store.count()).toBe(1);
  });

  it('storeId e storeName juntos: 400 e nada é gravado', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const store = await lojaDe(userId, 'Mercado Bom');

    const res = await post(cookie, { storeId: store.id, storeName: 'Outra' });

    expect(res.status).toBe(400);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.store.count()).toBe(1);
  });

  it.each([
    ['storeId não-UUID', { storeId: 'abc' }],
    ['storeId null', { storeId: null }],
    ['storeName null', { storeName: null }],
    ['storeName vazio', { storeName: '' }],
    ['storeName só espaços', { storeName: '   ' }],
  ])('%s: 400 e nada é gravado', async (_nome, extra) => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, extra);

    expect(res.status).toBe(400);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.store.count()).toBe(0);
  });

  it('sem loja continua aceito, com store nula (CA8)', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, {});

    expect(res.status).toBe(201);
    expect(res.body.data.store).toBeNull();
  });
});
