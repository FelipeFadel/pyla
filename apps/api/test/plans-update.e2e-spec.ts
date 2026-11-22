import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describe('PATCH /plans/:id (e2e)', () => {
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

  async function sessao(role: Role, email = 'a@x.com') {
    const res = await server()
      .post('/auth/register')
      .send({ email, password: 'senha1234' })
      .expect(201);
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0].split(
      ';',
    )[0];
    await prisma.user.update({
      where: { id: res.body.data.id as string },
      data: { role },
    });
    return { cookie, userId: res.body.data.id as string };
  }

  const criarPlano = (name: string, priceCents: number, active = true) =>
    prisma.plan.create({
      data: { name, nameKey: name.toLowerCase(), priceCents, active },
    });

  const editar = (cookie: string, id: string, body: Record<string, unknown>) =>
    server().patch(`/plans/${id}`).set('Cookie', cookie).send(body);

  const disponiveis = (cookie: string) =>
    server().get('/plans/available').set('Cookie', cookie);

  describe('edição válida', () => {
    it('edita só o nome: 200 e preço intacto (CA6)', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, { name: 'Básico Plus' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        id: plano.id,
        name: 'Básico Plus',
        price: 10,
        active: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.name).toBe('Básico Plus');
      expect(gravado.nameKey).toBe('básico plus');
      expect(gravado.priceCents).toBe(1000);
    });

    it('edita só o preço em centavos sem erro de ponto flutuante', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, { price: 1.15 });

      expect(res.status).toBe(200);
      expect(res.body.data.price).toBe(1.15);
      expect(res.body.data.name).toBe('Basico');
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.priceCents).toBe(115);
      expect(gravado.nameKey).toBe('basico');
    });

    it('edita nome e preço juntos, com trim no nome', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, {
        name: '  Premium  ',
        price: 49.9,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Premium');
      expect(res.body.data.price).toBe(49.9);
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.nameKey).toBe('premium');
      expect(gravado.priceCents).toBe(4990);
    });

    it('manter o próprio nome com outra caixa é permitido (CA4)', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Premium', 1000);

      const res = await editar(cookie, plano.id, { name: ' PREMIUM ' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('PREMIUM');
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.nameKey).toBe('premium');
    });

    it('a resposta não vaza nameKey nem priceCents', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Premium', 1000);

      const res = await editar(cookie, plano.id, { price: 20 });

      expect(res.body.data.nameKey).toBeUndefined();
      expect(res.body.data.priceCents).toBeUndefined();
    });
  });

  describe('validação (CA3): 400 indicando o campo e plano intacto', () => {
    const casos: [string, Record<string, unknown>, string][] = [
      ['nome vazio', { name: '' }, 'name'],
      ['nome só com espaços', { name: '   ' }, 'name'],
      ['nome com 61 caracteres', { name: 'a'.repeat(61) }, 'name'],
      ['nome que não é texto', { name: 123 }, 'name'],
      ['nome nulo', { name: null }, 'name'],
      ['preço em texto', { price: 'dez' }, 'price'],
      ['preço numérico em texto', { price: '10' }, 'price'],
      ['preço nulo', { price: null }, 'price'],
      ['preço zero', { price: 0 }, 'price'],
      ['preço negativo', { price: -1 }, 'price'],
      ['preço acima do máximo', { price: 10000 }, 'price'],
      ['preço com 3 casas', { price: 1.234 }, 'price'],
      ['active em texto', { active: 'true' }, 'active'],
      ['active numérico', { active: 1 }, 'active'],
      ['active nulo', { active: null }, 'active'],
    ];

    it.each(casos)('%s', async (_nome, body, campo) => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, body);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          { field: campo, messages: expect.any(Array) },
        ]),
      );
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.name).toBe('Basico');
      expect(gravado.priceCents).toBe(1000);
      expect(gravado.active).toBe(true);
    });

    it('corpo vazio: 400', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, {});

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(expect.any(String));
      expect(res.body.details).toEqual([
        { field: 'body', messages: expect.any(Array) },
      ]);
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.updatedAt).toEqual(plano.updatedAt);
    });

    it.each(['nameKey', 'priceCents', 'id'])(
      'campo extra %s no corpo é recusado',
      async (extra) => {
        const { cookie } = await sessao(Role.ADMIN);
        const plano = await criarPlano('Basico', 1000);

        const res = await editar(cookie, plano.id, {
          name: 'Novo',
          [extra]: 'x',
        });

        expect(res.status).toBe(400);
        const gravado = await prisma.plan.findUniqueOrThrow({
          where: { id: plano.id },
        });
        expect(gravado.name).toBe('Basico');
      },
    );
  });

  describe('nome repetido (CA4): 409 apontando o nome', () => {
    it('renomear para o nome de outro plano, ignorando caixa e espaços', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      await criarPlano('Premium', 2000);
      const plano = await criarPlano('Basico', 1000);

      const res = await editar(cookie, plano.id, {
        name: '  pREMIUM ',
        price: 5,
      });

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
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.name).toBe('Basico');
      expect(gravado.nameKey).toBe('basico');
      expect(gravado.priceCents).toBe(1000);
    });
  });

  describe('plano com assinantes (CA6)', () => {
    it('mudar o preço não altera o preço contratado e available mostra o novo', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const { userId } = await sessao(Role.CUSTOMER, 'c@x.com');
      const plano = await criarPlano('Premium', 1990);
      const assinatura = await prisma.subscription.create({
        data: { userId, planId: plano.id, priceCents: 1990 },
      });

      const res = await editar(cookie, plano.id, {
        name: 'Premium Novo',
        price: 29.9,
      });

      expect(res.status).toBe(200);
      const intacta = await prisma.subscription.findUniqueOrThrow({
        where: { id: assinatura.id },
      });
      expect(intacta.priceCents).toBe(1990);
      expect(intacta.planId).toBe(plano.id);
      const lista = await disponiveis(cookie);
      expect(lista.body.data).toEqual([
        { id: plano.id, name: 'Premium Novo', price: 29.9 },
      ]);
    });
  });

  describe('ativar e desativar (CA7, CA8)', () => {
    it('desativar tira de available e a assinatura segue intacta', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const { userId } = await sessao(Role.CUSTOMER, 'c@x.com');
      const plano = await criarPlano('Premium', 1990);
      const assinatura = await prisma.subscription.create({
        data: { userId, planId: plano.id, priceCents: 1990 },
      });

      const res = await editar(cookie, plano.id, { active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(false);
      expect(res.body.data.name).toBe('Premium');
      expect(res.body.data.price).toBe(19.9);
      expect((await disponiveis(cookie)).body.data).toEqual([]);
      const intacta = await prisma.subscription.findUniqueOrThrow({
        where: { id: assinatura.id },
      });
      expect(intacta.priceCents).toBe(1990);
      expect(intacta.planId).toBe(plano.id);
    });

    it('ativar devolve o plano a available', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Premium', 1990, false);
      expect((await disponiveis(cookie)).body.data).toEqual([]);

      const res = await editar(cookie, plano.id, { active: true });

      expect(res.status).toBe(200);
      expect(res.body.data.active).toBe(true);
      expect((await disponiveis(cookie)).body.data).toEqual([
        { id: plano.id, name: 'Premium', price: 19.9 },
      ]);
    });
  });

  describe('plano inexistente e id inválido', () => {
    it.each([
      ['nome', { name: 'Novo' }],
      ['preço', { price: 10 }],
      ['active', { active: false }],
    ])('uuid inexistente editando %s: 404 (CA12)', async (_nome, body) => {
      const { cookie } = await sessao(Role.ADMIN);

      const res = await editar(cookie, ID_INEXISTENTE, body);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Plano não encontrado.');
      expect(await prisma.plan.count()).toBe(0);
    });

    it('id que não é uuid: 400 indicando o campo id', async () => {
      const { cookie } = await sessao(Role.ADMIN);

      const res = await editar(cookie, 'abc', { name: 'Novo' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([{ field: 'id', messages: expect.any(Array) }]),
      );
    });
  });

  it('cliente: 403 e plano intacto (CA13)', async () => {
    const { cookie } = await sessao(Role.CUSTOMER);
    const plano = await criarPlano('Basico', 1000);

    const res = await editar(cookie, plano.id, { name: 'Novo', active: false });

    expect(res.status).toBe(403);
    const gravado = await prisma.plan.findUniqueOrThrow({
      where: { id: plano.id },
    });
    expect(gravado.name).toBe('Basico');
    expect(gravado.active).toBe(true);
  });

  it('sem sessão: 401 e plano intacto (CA14)', async () => {
    const plano = await criarPlano('Basico', 1000);

    const res = await server()
      .patch(`/plans/${plano.id}`)
      .send({ name: 'Novo' });

    expect(res.status).toBe(401);
    const gravado = await prisma.plan.findUniqueOrThrow({
      where: { id: plano.id },
    });
    expect(gravado.name).toBe('Basico');
  });
});
