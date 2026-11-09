import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const SENHA = 'senha1234';

describe('POST /auth/logout (e2e)', () => {
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

  const server = () => request(app.getHttpServer());
  const cookieDe = (res: request.Response) =>
    (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];

  it('CA8: logout invalida o token do dispositivo e o de outro dispositivo', async () => {
    const registro = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: SENHA })
      .expect(201);
    const cookie1 = cookieDe(registro);
    const login = await server()
      .post('/auth/login')
      .send({ email: 'a@x.com', password: SENHA })
      .expect(200);
    const cookie2 = cookieDe(login);

    await server().get('/auth/me').set('Cookie', cookie1).expect(200);
    await server().get('/auth/me').set('Cookie', cookie2).expect(200);

    const res = await server()
      .post('/auth/logout')
      .set('Cookie', cookie1)
      .expect(200);

    const setCookie = (res.headers['set-cookie'] as unknown as string[]).find(
      (c) => c.startsWith('pyla_session='),
    )!;
    expect(setCookie).toMatch(/^pyla_session=;/);
    expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Lax/);
    expect(setCookie).toMatch(/Path=\//);

    await server().get('/auth/me').set('Cookie', cookie1).expect(401);
    await server().get('/auth/me').set('Cookie', cookie2).expect(401);
  });

  it('sem sessão: 401', async () => {
    await server().post('/auth/logout').expect(401);
  });
});
