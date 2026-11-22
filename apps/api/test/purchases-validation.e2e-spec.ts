import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Clock } from '../src/common/clock.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('POST /purchases: validação, tudo ou nada (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let categoryId: string;
  // Instante "agora" do teste; o padrão é o relógio real.
  let now = new Date();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    })
      .overrideProvider(Clock)
      .useValue({ now: () => now })
      .compile();
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
    await prisma.category.deleteMany({ where: { ownerId: { not: null } } });
    await prisma.user.deleteMany();
  }

  beforeEach(async () => {
    now = new Date();
    await limpar();
  });

  afterAll(async () => {
    // FKs Restrict para User: não deixar sobra para os outros arquivos.
    await limpar();
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao(email = 'a@x.com') {
    const res = await server()
      .post('/auth/register')
      .send({ email, password: 'senha1234' })
      .expect(201);
    return (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  }

  const hoje = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(now);

  const baseItem = () => ({
    name: 'Arroz',
    categoryId,
    quantity: 2,
    packageSize: 5,
    unit: 'KG',
    fullPriceCents: 2599,
  });

  const send = (cookie: string, body: object) =>
    server().post('/purchases').set('Cookie', cookie).send(body);

  const post = (cookie: string, itemExtra: object = {}, extra: object = {}) =>
    send(cookie, {
      date: hoje(),
      items: [{ ...baseItem(), ...itemExtra }],
      ...extra,
    });

  async function nadaGravado() {
    expect(await prisma.purchase.count()).toBe(0);
    expect(await prisma.purchaseItem.count()).toBe(0);
    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.store.count()).toBe(0);
  }

  function campos(res: request.Response): string[] {
    return (res.body.details ?? []).map((d: { field: string }) => d.field);
  }

  async function recusada(res: request.Response, field: string) {
    expect(res.status).toBe(400);
    expect(campos(res)).toContain(field);
    await nadaGravado();
  }

  describe('itens (CA13)', () => {
    it.each([
      ['fullPriceCents 0', { fullPriceCents: 0 }, 'fullPriceCents'],
      ['fullPriceCents negativo', { fullPriceCents: -1 }, 'fullPriceCents'],
      ['fullPriceCents acima do limite', { fullPriceCents: 10_000_001 }, 'fullPriceCents'],
      ['fullPriceCents decimal', { fullPriceCents: 10.5 }, 'fullPriceCents'],
      ['quantity 0', { quantity: 0 }, 'quantity'],
      ['quantity negativa', { quantity: -1 }, 'quantity'],
      ['quantity acima do limite', { quantity: 10000 }, 'quantity'],
      ['quantity com 4 casas', { quantity: 1.2345 }, 'quantity'],
      ['quantity minúscula (1e-7)', { quantity: 1e-7 }, 'quantity'],
      ['quantity enorme (1e21)', { quantity: 1e21 }, 'quantity'],
      ['quantity texto', { quantity: '2' }, 'quantity'],
      ['packageSize ausente', { packageSize: undefined }, 'packageSize'],
      ['packageSize 0', { packageSize: 0 }, 'packageSize'],
      ['packageSize negativo', { packageSize: -5 }, 'packageSize'],
      ['packageSize acima do limite', { packageSize: 100000 }, 'packageSize'],
      ['packageSize com 4 casas', { packageSize: 0.0001 }, 'packageSize'],
      ['packageSize enorme (1e21)', { packageSize: 1e21 }, 'packageSize'],
      ['unit fora da lista', { unit: 'LB' }, 'unit'],
      ['unit ausente', { unit: undefined }, 'unit'],
      ['name vazio', { name: '' }, 'name'],
      ['name só espaços', { name: '   ' }, 'name'],
      ['name com 81 caracteres', { name: 'a'.repeat(81) }, 'name'],
      ['name com NUL', { name: 'Ar\u0000roz' }, 'name'],
      ['name só marcas combinantes', { name: '́' }, 'name'],
      ['name com surrogate solto', { name: 'Arroz\ud800' }, 'name'],
    ])('%s: 400 em items.0.<campo> e nada gravado', async (_nome, extra, campo) => {
      const cookie = await sessao();

      const res = await post(cookie, extra);

      await recusada(res, `items.0.${campo}`);
    });

    it('aponta o índice do item inválido e nada é gravado, nem o produto do item válido', async () => {
      const cookie = await sessao();

      const res = await send(cookie, {
        date: hoje(),
        items: [baseItem(), { ...baseItem(), name: 'Feijão' }, { ...baseItem(), name: 'Sal', quantity: 0 }],
      });

      await recusada(res, 'items.2.quantity');
      expect(campos(res)).not.toContain('items.0.quantity');
    });

    it('item inválido com loja nova: a loja não é criada', async () => {
      const cookie = await sessao();

      const res = await post(cookie, { quantity: 0 }, { storeName: 'Loja Nova' });

      await recusada(res, 'items.0.quantity');
    });

    it('os valores nos limites são aceitos', async () => {
      const cookie = await sessao();

      const res = await post(cookie, {
        name: 'a'.repeat(80),
        fullPriceCents: 10_000_000,
        quantity: 9999.999,
        packageSize: 99999.999,
      });

      expect(res.status).toBe(201);
      const saved = await prisma.purchaseItem.findFirstOrThrow();
      expect(Number(saved.quantity)).toBe(9999.999);
      expect(Number(saved.packageSize)).toBe(99999.999);
    });

    it('100 itens são aceitos', async () => {
      const cookie = await sessao();

      const res = await send(cookie, {
        date: hoje(),
        items: Array.from({ length: 100 }, (_, i) => ({
          ...baseItem(),
          name: `Produto ${i}`,
        })),
      });

      expect(res.status).toBe(201);
      expect(await prisma.purchaseItem.count()).toBe(100);
    });

    it('101 itens: 400 em items e nada gravado', async () => {
      const cookie = await sessao();

      const res = await send(cookie, {
        date: hoje(),
        items: Array.from({ length: 101 }, (_, i) => ({
          ...baseItem(),
          name: `Produto ${i}`,
        })),
      });

      await recusada(res, 'items');
    });
  });

  describe('loja', () => {
    it.each([
      ['com 81 caracteres', 'l'.repeat(81)],
      ['com NUL', 'Lo\u0000ja'],
      ['só marcas combinantes', '́'],
      ['só espaços', '   '],
    ])('storeName %s: 400 em storeName e nada gravado', async (_nome, storeName) => {
      const cookie = await sessao();

      const res = await post(cookie, {}, { storeName });

      await recusada(res, 'storeName');
    });

    it('storeName com 80 caracteres é aceito', async () => {
      const cookie = await sessao();

      const res = await post(cookie, {}, { storeName: 'l'.repeat(80) });

      expect(res.status).toBe(201);
    });

    it('storeId junto com storeName: 400 com o campo storeId no corpo', async () => {
      const cookie = await sessao();

      const res = await post(
        cookie,
        {},
        { storeId: '11111111-1111-4111-8111-111111111111', storeName: 'Loja' },
      );

      await recusada(res, 'storeId');
    });
  });

  describe('produto', () => {
    it('productId junto com name: 400 com o campo items.0.productId no corpo', async () => {
      const cookie = await sessao();

      const res = await post(cookie, {
        productId: '11111111-1111-4111-8111-111111111111',
      });

      await recusada(res, 'items.0.productId');
    });
  });

  describe('categoria (CA4)', () => {
    it('categoria inexistente: 400 em items.0.categoryId e nada gravado', async () => {
      const cookie = await sessao();

      const res = await post(cookie, {
        categoryId: '11111111-1111-4111-8111-111111111111',
      });

      await recusada(res, 'items.0.categoryId');
    });

    it('categoria personalizada (não fixa): 400 em items.0.categoryId e nada gravado', async () => {
      const cookie = await sessao();
      const owner = await prisma.user.findFirstOrThrow();
      const custom = await prisma.category.create({
        data: { name: 'Minha', ownerId: owner.id },
      });

      const res = await post(cookie, { categoryId: custom.id });

      await recusada(res, 'items.0.categoryId');
    });

    it('categoria inválida no segundo item aponta o índice 1', async () => {
      const cookie = await sessao();

      const res = await send(cookie, {
        date: hoje(),
        items: [
          baseItem(),
          {
            ...baseItem(),
            name: 'Feijão',
            categoryId: '11111111-1111-4111-8111-111111111111',
          },
        ],
      });

      await recusada(res, 'items.1.categoryId');
    });
  });

  describe('data (CA14)', () => {
    it.each([
      ['formato errado', '22/11/2026'],
      ['com hora', '2026-11-22T00:00:00Z'],
      ['vazia', ''],
      ['null', null],
      ['número', 20261122],
      ['mês 13 e dia 45', '2026-13-45'],
      ['30 de fevereiro', '2026-02-30'],
      ['29 de fevereiro em ano não bissexto', '2027-02-29'],
      ['ano zero', '0000-01-01'],
    ])('data %s: 400 em date e nada gravado', async (_nome, date) => {
      const cookie = await sessao();

      const res = await send(cookie, { date, items: [baseItem()] });

      await recusada(res, 'date');
    });

    it('data futura: 400 em date e nada gravado', async () => {
      const cookie = await sessao();
      now = new Date('2026-11-22T15:00:00Z');

      const res = await send(cookie, { date: '2026-11-23', items: [baseItem()] });

      await recusada(res, 'date');
    });

    it('perto da meia-noite de São Paulo, ainda é 22/11 às 23:59: hoje aceito, amanhã recusado', async () => {
      const cookie = await sessao();
      // 23:59 de 22/11 em São Paulo (UTC-3) já é 23/11 em UTC.
      now = new Date('2026-11-23T02:59:00Z');

      const hojeOk = await send(cookie, { date: '2026-11-22', items: [baseItem()] });
      expect(hojeOk.status).toBe(201);

      const amanha = await send(cookie, { date: '2026-11-23', items: [baseItem()] });
      expect(amanha.status).toBe(400);
      expect(campos(amanha)).toContain('date');
      expect(await prisma.purchase.count()).toBe(1);
    });

    it('às 00:01 de 23/11 em São Paulo, 23/11 já é hoje e 24/11 é futuro', async () => {
      const cookie = await sessao();
      now = new Date('2026-11-23T03:01:00Z');

      const hojeOk = await send(cookie, { date: '2026-11-23', items: [baseItem()] });
      expect(hojeOk.status).toBe(201);

      const amanha = await send(cookie, { date: '2026-11-24', items: [baseItem()] });
      expect(amanha.status).toBe(400);
      expect(campos(amanha)).toContain('date');
      expect(await prisma.purchase.count()).toBe(1);
    });

    it('uma data passada é aceita', async () => {
      const cookie = await sessao();

      const res = await send(cookie, { date: '2020-02-29', items: [baseItem()] });

      expect(res.status).toBe(201);
    });
  });

  describe('lista de itens (CA15)', () => {
    it.each([
      ['vazia', []],
      ['ausente', undefined],
      ['null', null],
      ['texto', 'x'],
      ['com null dentro', [null]],
      ['com número dentro', [5]],
      ['com texto dentro', ['x']],
    ])('items %s: 400 e nada gravado', async (_nome, items) => {
      const cookie = await sessao();

      const res = await send(cookie, { date: hoje(), items });

      expect(res.status).toBe(400);
      expect(campos(res).some((f) => f.startsWith('items'))).toBe(true);
      await nadaGravado();
    });
  });
});
