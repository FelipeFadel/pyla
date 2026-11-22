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

describe('POST /purchases: descontos e total (e2e)', () => {
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
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  }

  // Valor cheio do item: 500 × 2 = 1000.
  const item = {
    name: 'Arroz',
    categoryId: '',
    quantity: 2,
    packageSize: 1,
    unit: 'KG',
    fullPriceCents: 500,
  };

  const post = (cookie: string, extra: object, itemExtra: object = {}) =>
    server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send({
        date: todaySaoPaulo(),
        items: [{ ...item, categoryId, ...itemExtra }],
        ...extra,
      });

  async function nadaGravado() {
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.store.count()).toBe(0);
  }

  it.each([0, 1, 400, 1000])(
    'discountCents %i (entre 0 e o valor cheio) é aceito (CA10)',
    async (discountCents) => {
      const cookie = await sessao('a@x.com');

      const res = await post(cookie, {}, { discountCents });

      expect(res.status).toBe(201);
      const [created] = res.body.data.items;
      expect(created.discountCents).toBe(discountCents);
      expect(created.valueCents).toBe(1000 - discountCents);
      expect(res.body.data.itemsTotalCents).toBe(1000 - discountCents);
      const saved = await prisma.purchaseItem.findFirstOrThrow();
      expect(saved.discountCents).toBe(discountCents);
    },
  );

  it('sem discountCents o padrão é 0 (CA10)', async () => {
    const cookie = await sessao('a@x.com');

    const res = await post(cookie, {});

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].discountCents).toBe(0);
    expect(res.body.data.items[0].valueCents).toBe(1000);
  });

  it('o limite do desconto usa o valor cheio arredondado (CA10)', async () => {
    const cookie = await sessao('a@x.com');

    // 333 × 1,5 = 499,5 → 500: desconto 500 aceito, 501 recusado.
    const base = { quantity: 1.5, fullPriceCents: 333 };
    const ok = await post(cookie, {}, { ...base, discountCents: 500 });
    expect(ok.status).toBe(201);
    expect(ok.body.data.items[0].valueCents).toBe(0);

    const ruim = await post(cookie, {}, { ...base, discountCents: 501 });
    expect(ruim.status).toBe(400);
    expect(JSON.stringify(ruim.body)).toContain('items.0.discountCents');
  });

  it.each([
    ['negativo', -1],
    ['maior que o valor cheio', 1001],
    ['decimal', 10.5],
    ['null', null],
    ['texto', '10'],
    ['acima do Int do Postgres', 2147483648],
  ])('discountCents %s: 400 em items.N.discountCents e nada gravado (CA10)', async (_nome, discountCents) => {
    const cookie = await sessao('a@x.com');

    const res = await post(cookie, {}, { discountCents });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('items.0.discountCents');
    await nadaGravado();
  });

  it('desconto inválido no segundo item aponta o índice 1 e nada é gravado (CA10)', async () => {
    const cookie = await sessao('a@x.com');

    const res = await server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send({
        date: todaySaoPaulo(),
        items: [
          { ...item, categoryId, discountCents: 100 },
          { ...item, name: 'Feijão', categoryId, discountCents: 1001 },
        ],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('items.1.discountCents');
    await nadaGravado();
  });

  it.each([0, 1, 700, 1000])(
    'paidTotalCents %i (entre 0 e a soma com descontos) é aceito e traz o desconto de caixa (CA11)',
    async (paidTotalCents) => {
      const cookie = await sessao('a@x.com');

      // Soma com desconto: 1000 − 0 = 1000.
      const res = await post(cookie, { paidTotalCents });

      expect(res.status).toBe(201);
      expect(res.body.data.itemsTotalCents).toBe(1000);
      expect(res.body.data.cashDiscountCents).toBe(1000 - paidTotalCents);
      expect(res.body.data.totalCents).toBe(paidTotalCents);
      const saved = await prisma.purchase.findFirstOrThrow();
      expect(saved.paidTotalCents).toBe(paidTotalCents);
    },
  );

  it('o limite do total pago é a soma já com os descontos dos itens (CA11)', async () => {
    const cookie = await sessao('a@x.com');

    // Soma com desconto: 1000 − 300 = 700.
    const ok = await post(cookie, { paidTotalCents: 700 }, { discountCents: 300 });
    expect(ok.status).toBe(201);
    expect(ok.body.data.itemsTotalCents).toBe(700);
    expect(ok.body.data.cashDiscountCents).toBe(0);

    const ruim = await post(
      cookie,
      { paidTotalCents: 701 },
      { discountCents: 300 },
    );
    expect(ruim.status).toBe(400);
    expect(JSON.stringify(ruim.body)).toContain('paidTotalCents');
    expect(await prisma.purchase.count()).toBe(1);
  });

  it.each([
    ['negativo', -1],
    ['maior que a soma', 1001],
    ['decimal', 10.5],
    ['null', null],
    ['texto', '10'],
    ['acima do Int do Postgres', 2147483648],
  ])('paidTotalCents %s: 400 em paidTotalCents e nada gravado (CA11)', async (_nome, paidTotalCents) => {
    const cookie = await sessao('a@x.com');

    const res = await post(cookie, { paidTotalCents });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('paidTotalCents');
    await nadaGravado();
  });

  it('sem paidTotalCents o desconto de caixa é 0 e o total é a soma (CA12)', async () => {
    const cookie = await sessao('a@x.com');

    const res = await post(cookie, {}, { discountCents: 250 });

    expect(res.status).toBe(201);
    expect(res.body.data.itemsTotalCents).toBe(750);
    expect(res.body.data.cashDiscountCents).toBe(0);
    expect(res.body.data.totalCents).toBe(750);
    const saved = await prisma.purchase.findFirstOrThrow();
    expect(saved.paidTotalCents).toBeNull();
  });
});
