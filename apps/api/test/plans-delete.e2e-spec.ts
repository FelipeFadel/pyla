import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PlansRepository } from '../src/plans/plans.repository.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describe('DELETE /plans/:id (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let repository: PlansRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get(PlansRepository);
  });

  beforeEach(async () => {
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  const excluir = (cookie: string, id: string) =>
    server().delete(`/plans/${id}`).set('Cookie', cookie);

  const lista = (cookie: string) => server().get('/plans').set('Cookie', cookie);

  const disponiveis = (cookie: string) =>
    server().get('/plans/available').set('Cookie', cookie);

  describe('plano sem assinantes (CA10)', () => {
    it('exclui: 204 e some da lista, de available e do banco', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);
      await criarPlano('Premium', 2000);

      const res = await excluir(cookie, plano.id);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      const todos = await lista(cookie);
      expect(todos.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Premium',
      ]);
      const ativos = await disponiveis(cookie);
      expect(ativos.body.data.map((p: { name: string }) => p.name)).toEqual([
        'Premium',
      ]);
      expect(await prisma.plan.findUnique({ where: { id: plano.id } })).toBeNull();
    });

    it('exclui também um plano inativo', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Antigo', 1000, false);

      const res = await excluir(cookie, plano.id);

      expect(res.status).toBe(204);
      expect(await prisma.plan.count()).toBe(0);
      expect((await lista(cookie)).body.data).toEqual([]);
    });
  });

  describe('plano com assinantes (CA11)', () => {
    it('409 sugerindo desativar; plano e assinatura permanecem', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const { userId } = await sessao(Role.CUSTOMER, 'c@x.com');
      const plano = await criarPlano('Premium', 1990);
      const assinatura = await prisma.subscription.create({
        data: { userId, planId: plano.id, priceCents: 1990 },
      });

      const res = await excluir(cookie, plano.id);

      expect(res.status).toBe(409);
      expect(res.body.statusCode).toBe(409);
      expect(res.body.message).toContain('desativ');
      const texto = JSON.stringify(res.body).toLowerCase();
      for (const vazamento of ['p2003', 'prisma', 'constraint', 'foreign']) {
        expect(texto).not.toContain(vazamento);
      }
      const gravado = await prisma.plan.findUniqueOrThrow({
        where: { id: plano.id },
      });
      expect(gravado.name).toBe('Premium');
      const intacta = await prisma.subscription.findUniqueOrThrow({
        where: { id: assinatura.id },
      });
      expect(intacta.planId).toBe(plano.id);
      expect(intacta.priceCents).toBe(1990);
      expect((await lista(cookie)).body.data).toHaveLength(1);
    });

    it('corrida: assinatura surge após a checagem; o banco recusa e vira o mesmo 409', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const { userId } = await sessao(Role.CUSTOMER, 'c@x.com');
      const plano = await criarPlano('Premium', 1990);
      await prisma.subscription.create({
        data: { userId, planId: plano.id, priceCents: 1990 },
      });
      // A checagem prévia "não vê" a assinatura; só a FK Restrict segura.
      vi.spyOn(repository, 'countSubscriptions').mockResolvedValue(0);

      const res = await excluir(cookie, plano.id);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('desativ');
      expect(JSON.stringify(res.body).toLowerCase()).not.toContain('p2003');
      expect(await prisma.plan.count()).toBe(1);
      expect(await prisma.subscription.count()).toBe(1);
    });
  });

  describe('plano inexistente e id inválido (CA12)', () => {
    it('uuid inexistente: 404', async () => {
      const { cookie } = await sessao(Role.ADMIN);

      const res = await excluir(cookie, ID_INEXISTENTE);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Plano não encontrado.');
    });

    it('excluir duas vezes: 204 e depois 404', async () => {
      const { cookie } = await sessao(Role.ADMIN);
      const plano = await criarPlano('Basico', 1000);

      expect((await excluir(cookie, plano.id)).status).toBe(204);
      const segunda = await excluir(cookie, plano.id);

      expect(segunda.status).toBe(404);
      expect(segunda.body.message).toBe('Plano não encontrado.');
    });

    it('id que não é uuid: 400 indicando o campo id', async () => {
      const { cookie } = await sessao(Role.ADMIN);

      const res = await excluir(cookie, 'abc');

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([{ field: 'id', messages: expect.any(Array) }]),
      );
    });
  });

  it('cliente: 403 e plano intacto (CA13)', async () => {
    const { cookie } = await sessao(Role.CUSTOMER);
    const plano = await criarPlano('Basico', 1000);

    const res = await excluir(cookie, plano.id);

    expect(res.status).toBe(403);
    expect(await prisma.plan.count()).toBe(1);
  });

  it('sem sessão: 401 e plano intacto (CA14)', async () => {
    const plano = await criarPlano('Basico', 1000);

    const res = await server().delete(`/plans/${plano.id}`);

    expect(res.status).toBe(401);
    expect(await prisma.plan.count()).toBe(1);
  });
});
