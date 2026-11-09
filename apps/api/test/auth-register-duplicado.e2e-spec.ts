import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const SENHA_VALIDA = 'senha1234';

describe('POST /auth/register com e-mail repetido (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  const registrar = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/register').send(body);

  function expectRecusaGenerica(res: request.Response, emails: string[]) {
    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.details).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();
    const texto = JSON.stringify(res.body).toLowerCase();
    for (const email of emails) expect(texto).not.toContain(email);
    for (const vazamento of [
      'p2002',
      'prisma',
      'unique',
      'constraint',
      'target',
      'meta',
      'stack',
      'user_email',
      SENHA_VALIDA,
    ]) {
      expect(texto).not.toContain(vazamento);
    }
    expect(typeof res.body.message).toBe('string');
  }

  it('recusa o mesmo e-mail com 400 genérico e mantém uma só conta', async () => {
    await registrar({ email: 'a@x.com', password: SENHA_VALIDA }).expect(201);

    const res = await registrar({ email: 'a@x.com', password: SENHA_VALIDA });

    expectRecusaGenerica(res, ['a@x.com']);
    expect(await prisma.user.count()).toBe(1);
  });

  it('recusa o mesmo e-mail com outras maiúsculas e espaços nas pontas', async () => {
    await registrar({ email: 'a@x.com', password: SENHA_VALIDA }).expect(201);

    const res = await registrar({ email: ' A@X.com ', password: SENHA_VALIDA });

    expectRecusaGenerica(res, ['a@x.com']);
    expect(await prisma.user.count()).toBe(1);
  });

  it('a recusa de e-mail repetido é a mesma para qualquer e-mail repetido', async () => {
    await registrar({ email: 'a@x.com', password: SENHA_VALIDA }).expect(201);
    await registrar({ email: 'b@x.com', password: SENHA_VALIDA }).expect(201);

    const ra = await registrar({ email: 'a@x.com', password: SENHA_VALIDA });
    const rb = await registrar({ email: 'b@x.com', password: SENHA_VALIDA });

    expect(ra.body.message).toBe(rb.body.message);
    expect(ra.body.error).toBe(rb.body.error);
  });

  it('dois cadastros simultâneos com o mesmo e-mail: um 201 e um 400', async () => {
    const [r1, r2] = await Promise.all([
      registrar({ email: 'a@x.com', password: SENHA_VALIDA }),
      registrar({ email: ' A@X.com', password: SENHA_VALIDA }),
    ]);

    const status = [r1.status, r2.status].sort((a, b) => a - b);
    expect(status).toEqual([201, 400]);
    const recusado = r1.status === 400 ? r1 : r2;
    expectRecusaGenerica(recusado, ['a@x.com']);
    expect(await prisma.user.count()).toBe(1);
  });

  it('erro de formato continua com details por campo', async () => {
    const res = await registrar({ email: 'ruim', password: SENHA_VALIDA });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual([
      { field: 'email', messages: expect.any(Array) },
    ]);
  });
});
