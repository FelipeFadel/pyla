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

describe('POST /purchases: reaproveitar produto (e2e)', () => {
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

  beforeEach(async () => {
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Produto tem FK Restrict para User: não deixar sobra para os outros arquivos.
    await prisma.purchase.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
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

  const priced = {
    quantity: 1,
    packageSize: 1,
    unit: 'KG',
    fullPriceCents: 500,
  };
  const newItem = (name: string) => ({ name, categoryId, ...priced });
  const body = (items: object[]) => ({ date: todaySaoPaulo(), items });

  const post = (cookie: string, items: object[]) =>
    server().post('/purchases').set('Cookie', cookie).send(body(items));

  async function produtoDe(userId: string, name: string) {
    return prisma.product.create({
      data: {
        userId,
        name,
        normalizedName: name.trim().toLowerCase(),
        categoryId,
      },
    });
  }

  it('productId de produto do usuário reaproveita e não cria outro (CA2)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const product = await produtoDe(userId, 'feijao');

    const res = await post(cookie, [{ productId: product.id, ...priced }]);

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].product.id).toBe(product.id);
    expect(await prisma.product.count()).toBe(1);
  });

  it('mesmo nome com maiúsculas e espaços diferentes reaproveita (CA2)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const product = await produtoDe(userId, 'feijao preto');

    const res = await post(cookie, [newItem('  FEIJAO   Preto ')]);

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].product.id).toBe(product.id);
    expect(await prisma.product.count()).toBe(1);
  });

  it('productId inexistente: 404 e nada é gravado (CA5)', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, [
      newItem('Novo'),
      { productId: '00000000-0000-4000-8000-000000000000', ...priced },
    ]);

    expect(res.status).toBe(404);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
  });

  it('productId de outro usuário: 404 e nada é gravado (CA5)', async () => {
    const { cookie } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    const alheio = await produtoDe(outro.userId, 'alheio');

    const res = await post(cookie, [{ productId: alheio.id, ...priced }]);

    expect(res.status).toBe(404);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(1);
  });

  it('o mesmo produto novo em dois itens gera um só produto (CA6)', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, [newItem('Leite'), newItem(' leite ')]);

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0].product.id).toBe(
      res.body.data.items[1].product.id,
    );
    expect(await prisma.product.count()).toBe(1);
  });

  it('duas compras simultâneas com o mesmo produto novo deixam um só produto (CA6)', async () => {
    const { cookie, userId } = await sessao('a@x.com');

    const [r1, r2] = await Promise.all([
      post(cookie, [newItem('Café')]),
      post(cookie, [newItem('café')]),
    ]);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(await prisma.product.count({ where: { userId } })).toBe(1);
    expect(await prisma.purchase.count({ where: { userId } })).toBe(2);
  });

  it('item sem productId nem name: 400', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, [{ categoryId, ...priced }]);

    expect(res.status).toBe(400);
    expect(await prisma.purchase.count()).toBe(0);
  });

  it('item com productId null e sem name: 400 e nada é gravado', async () => {
    const { cookie } = await sessao('a@x.com');

    const res = await post(cookie, [{ productId: null, ...priced }]);

    expect(res.status).toBe(400);
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
  });

  it('item com productId e name juntos: 400', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const product = await produtoDe(userId, 'feijao');

    const res = await post(cookie, [
      { productId: product.id, name: 'Feijao', ...priced },
    ]);

    expect(res.status).toBe(400);
    expect(await prisma.purchase.count()).toBe(0);
  });
});
