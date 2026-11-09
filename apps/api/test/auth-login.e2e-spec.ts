import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const SENHA = 'senha1234';
const SETE_DIAS = 7 * 24 * 60 * 60;

describe('POST /auth/login (e2e)', () => {
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
    await prisma.user.deleteMany();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'a@x.com', password: SENHA })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/login').send(body);

  it('loga com e-mail em outra capitalização: 200 e cookie httpOnly de 7 dias', async () => {
    const res = await login({ email: ' A@X.com ', password: SENHA });

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatch(/^pyla_session=[^;]+/);
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain(`Max-Age=${SETE_DIAS}`);
    expect(res.body.data).toEqual({ id: expect.any(String), email: 'a@x.com' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('senha errada e e-mail inexistente: 401 idêntico e sem cookie', async () => {
    const errada = await login({ email: 'a@x.com', password: 'outra1234' });
    const inexistente = await login({ email: 'z@x.com', password: SENHA });

    for (const res of [errada, inexistente]) {
      expect(res.status).toBe(401);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    const semTimestamp = (b: Record<string, unknown>) => ({
      ...b,
      timestamp: undefined,
    });
    expect(semTimestamp(errada.body)).toEqual(semTimestamp(inexistente.body));
    expect(errada.body.message).toBe('E-mail ou senha inválidos.');
  });

  it('formato inválido é 400 com details; senha vazia é 400', async () => {
    const r1 = await login({ email: 'ruim', password: SENHA });
    expect(r1.status).toBe(400);
    expect(r1.body.details).toEqual([
      { field: 'email', messages: expect.any(Array) },
    ]);

    const r2 = await login({ email: 'a@x.com', password: '' });
    expect(r2.status).toBe(400);
    expect(r2.headers['set-cookie']).toBeUndefined();
  });

  it('não aplica política de senha: senha fraca errada é 401, não 400', async () => {
    const res = await login({ email: 'a@x.com', password: 'abc' });
    expect(res.status).toBe(401);
  });
});
