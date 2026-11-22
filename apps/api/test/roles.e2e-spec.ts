import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Public } from '../src/auth/public.decorator.js';
import { Roles } from '../src/auth/roles.decorator.js';
import { configureApp } from '../src/common/setup-app.js';
import { Role } from '../src/generated/prisma/enums.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Controller só de teste: exercita o RolesGuard global real.
@Controller('roles-probe')
class RolesProbeController {
  @Get('admin')
  @Roles(Role.ADMIN)
  admin() {
    return { ok: true };
  }

  @Get('customer')
  @Roles(Role.CUSTOMER)
  customer() {
    return { ok: true };
  }

  @Get('qualquer')
  qualquer() {
    return { ok: true };
  }

  @Public()
  @Get('publica')
  @Roles(Role.ADMIN)
  publica() {
    return { ok: true };
  }
}

describe('RolesGuard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
      controllers: [RolesProbeController],
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
  const get = (path: string, cookie?: string) => {
    const req = server().get(path);
    return cookie ? req.set('Cookie', cookie) : req;
  };

  async function registrar(role: Role) {
    const res = await server()
      .post('/auth/register')
      .send({ email: 'a@x.com', password: 'senha1234' })
      .expect(201);
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0].split(
      ';',
    )[0];
    const id = res.body.data.id as string;
    await prisma.user.update({ where: { id }, data: { role } });
    return { cookie, id };
  }

  it('sem sessão: 401 (CA14)', async () => {
    const res = await get('/roles-probe/admin');
    expect(res.status).toBe(401);
  });

  it('cliente em rota de admin: 403 no formato do filtro global (CA13)', async () => {
    const { cookie } = await registrar(Role.CUSTOMER);
    const res = await get('/roles-probe/admin', cookie);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      path: '/roles-probe/admin',
    });
    expect(typeof res.body.message).toBe('string');
    expect(typeof res.body.timestamp).toBe('string');
    expect(res.body.data).toBeUndefined();
  });

  it('admin em rota de admin: 200', async () => {
    const { cookie } = await registrar(Role.ADMIN);
    const res = await get('/roles-probe/admin', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { ok: true } });
  });

  it('admin rebaixado no banco: 403 na requisição seguinte, mesma sessão (CA16)', async () => {
    const { cookie, id } = await registrar(Role.ADMIN);
    await get('/roles-probe/admin', cookie).expect(200);

    await prisma.user.update({ where: { id }, data: { role: Role.CUSTOMER } });

    await get('/roles-probe/admin', cookie).expect(403);
  });

  it('admin não passa em rota @Roles(CUSTOMER)', async () => {
    const { cookie } = await registrar(Role.ADMIN);
    await get('/roles-probe/customer', cookie).expect(403);
  });

  it('cliente passa em rota @Roles(CUSTOMER)', async () => {
    const { cookie } = await registrar(Role.CUSTOMER);
    await get('/roles-probe/customer', cookie).expect(200);
  });

  it('rota sem @Roles passa para qualquer autenticado, e 401 sem sessão', async () => {
    const cliente = await registrar(Role.CUSTOMER);
    await get('/roles-probe/qualquer', cliente.cookie).expect(200);
    await get('/roles-probe/qualquer').expect(401);
  });

  it('rota @Public com @Roles não é barrada (sem request.user)', async () => {
    await get('/roles-probe/publica').expect(200);
  });

  it('RolesGuard roda depois do JwtAuthGuard: sem sessão é 401, nunca 500', async () => {
    const res = await get('/roles-probe/admin');
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(401);
  });
});
