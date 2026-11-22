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

describe('POST /purchases (e2e)', () => {
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
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao() {
    const res = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: 'senha1234' })
      .expect(201);
    return {
      cookie: (res.headers['set-cookie'] as unknown as string[])[0].split(
        ';',
      )[0],
      userId: res.body.data.id as string,
    };
  }

  const validBody = () => ({
    date: todaySaoPaulo(),
    items: [
      {
        name: 'Arroz Branco',
        categoryId,
        quantity: 2,
        packageSize: 5,
        unit: 'KG',
        fullPriceCents: 2599,
      },
    ],
  });

  it('registra compra de hoje com produto novo, sem loja (CA1, CA3, CA8)', async () => {
    const { cookie, userId } = await sessao();

    const res = await server()
      .post('/purchases')
      .set('Cookie', cookie)
      .send(validBody());

    expect(res.status).toBe(201);
    const purchase = res.body.data;
    expect(purchase.status).toBe('CONFIRMED');
    expect(purchase.date).toBe(todaySaoPaulo());
    expect(purchase.store).toBeNull();
    expect(purchase.items).toHaveLength(1);
    expect(purchase.items[0]).toMatchObject({
      quantity: 2,
      packageSize: 5,
      unit: 'KG',
      fullPriceCents: 2599,
      discountCents: 0,
      product: { name: 'Arroz Branco', categoryId },
    });
    expect(purchase.itemsTotalCents).toBe(5198);
    expect(purchase.totalCents).toBe(5198);

    const saved = await prisma.purchase.findUniqueOrThrow({
      where: { id: purchase.id },
      include: { items: { include: { product: true } } },
    });
    expect(saved.userId).toBe(userId);
    expect(saved.status).toBe('CONFIRMED');
    expect(saved.storeId).toBeNull();
    expect(saved.items).toHaveLength(1);
    expect(saved.items[0].product.userId).toBe(userId);
    expect(saved.items[0].product.categoryId).toBe(categoryId);
    expect(saved.items[0].product.normalizedName).toBe('arroz branco');
  });

  it.each(['userId', 'status', 'confirmedAt'])(
    'corpo com %s: 400 e nada é gravado (CA16)',
    async (field) => {
      const { cookie } = await sessao();
      const extra: Record<string, unknown> = {
        userId: '00000000-0000-4000-8000-000000000000',
        status: 'DRAFT',
        confirmedAt: '2020-01-01T00:00:00.000Z',
      };

      const res = await server()
        .post('/purchases')
        .set('Cookie', cookie)
        .send({ ...validBody(), [field]: extra[field] });

      expect(res.status).toBe(400);
      expect(await prisma.purchase.count()).toBe(0);
      expect(await prisma.product.count()).toBe(0);
    },
  );

  it('sem sessão: 401 e nada é gravado (CA22)', async () => {
    const res = await server().post('/purchases').send(validBody());

    expect(res.status).toBe(401);
    expect(await prisma.purchase.count()).toBe(0);
  });
});
