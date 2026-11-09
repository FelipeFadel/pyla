import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const SENHA = 'senha1234';

describe('GET /auth/me e guard global (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let secret: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = moduleRef.get(PrismaService);
    jwt = new JwtService();
    secret = moduleRef.get(ConfigService).getOrThrow<string>('JWT_SECRET');
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => request(app.getHttpServer());
  const me = (cookie?: string) => {
    const req = server().get('/auth/me');
    return cookie ? req.set('Cookie', cookie) : req;
  };

  async function registrar() {
    const res = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: SENHA })
      .expect(201);
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0]
      .split(';')[0];
    return { cookie, id: res.body.data.id as string };
  }

  it('sem cookie: 401', async () => {
    const res = await me();
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Sessão inválida ou expirada.');
  });

  it('cookie adulterado: 401', async () => {
    const { cookie } = await registrar();
    const res = await me(`${cookie}x`);
    expect(res.status).toBe(401);
  });

  it('cookie com lixo: 401', async () => {
    const res = await me('pyla_session=nao-e-jwt');
    expect(res.status).toBe(401);
  });

  it('token expirado: 401', async () => {
    const { id } = await registrar();
    const token = await jwt.signAsync(
      { sub: id, tokenVersion: 0 },
      { secret, expiresIn: -10 },
    );
    const res = await me(`pyla_session=${token}`);
    expect(res.status).toBe(401);
  });

  it('tokenVersion diferente do banco: 401', async () => {
    const { id } = await registrar();
    const token = await jwt.signAsync(
      { sub: id, tokenVersion: 99 },
      { secret, expiresIn: 60 },
    );
    const res = await me(`pyla_session=${token}`);
    expect(res.status).toBe(401);
  });

  it('usuário inexistente no token: 401', async () => {
    const token = await jwt.signAsync(
      { sub: '00000000-0000-0000-0000-000000000000', tokenVersion: 0 },
      { secret, expiresIn: 60 },
    );
    const res = await me(`pyla_session=${token}`);
    expect(res.status).toBe(401);
  });

  it('sessão válida: 200 com { id, email } e sem hash', async () => {
    const { cookie, id } = await registrar();
    const res = await me(cookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id, email: 'a@x.com' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('register e login continuam abertas', async () => {
    await registrar();
    const login = await server()
      .post('/auth/login')
      .send({ email: 'a@x.com', password: SENHA });
    expect(login.status).toBe(200);
  });
});
