import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const SENHA_VALIDA = 'senha1234';

describe('POST /auth/register (e2e)', () => {
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

  function cookieDeSessao(res: request.Response): string {
    const cookies = res.headers['set-cookie'] as unknown as string[];
    const cookie = cookies.find((c) => c.startsWith('pyla_session='));
    expect(cookie).toBeDefined();
    return cookie as string;
  }

  describe('cadastro válido', () => {
    it('responde 201 com { id, email }, sem senha nem hash', async () => {
      const res = await registrar({
        email: 'a@x.com',
        password: SENHA_VALIDA,
      }).expect(201);

      expect(res.body).toEqual({
        data: { id: expect.any(String), email: 'a@x.com' },
      });
      const texto = JSON.stringify(res.body);
      expect(texto).not.toContain(SENHA_VALIDA);
      expect(texto).not.toContain('passwordHash');
      expect(texto).not.toContain('$2');
    });

    it('emite o cookie pyla_session httpOnly, SameSite=Lax, 7 dias, sem Secure fora de produção', async () => {
      const res = await registrar({ email: 'a@x.com', password: SENHA_VALIDA });

      const cookie = cookieDeSessao(res);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
      expect(cookie).toContain('Path=/');
      expect(cookie).not.toContain('Secure');
    });

    it('o JWT do cookie tem sub e tokenVersion e nada de senha ou hash', async () => {
      const res = await registrar({ email: 'a@x.com', password: SENHA_VALIDA });
      const salvo = await prisma.user.findUniqueOrThrow({
        where: { email: 'a@x.com' },
      });

      const token = cookieDeSessao(res).split(';')[0].split('=')[1];
      const partes = token.split('.');
      expect(partes).toHaveLength(3);
      const payload = JSON.parse(
        Buffer.from(partes[1], 'base64url').toString('utf8'),
      );
      expect(payload.sub).toBe(salvo.id);
      expect(payload.tokenVersion).toBe(0);
      expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
      const texto = JSON.stringify(payload);
      expect(texto).not.toContain(SENHA_VALIDA);
      expect(texto).not.toContain(salvo.passwordHash);
      expect(Object.keys(payload).sort()).toEqual([
        'exp',
        'iat',
        'sub',
        'tokenVersion',
      ]);
    });

    it('grava só o hash bcrypt, com tokenVersion 0', async () => {
      await registrar({ email: 'a@x.com', password: SENHA_VALIDA }).expect(201);

      const usuarios = await prisma.user.findMany();
      expect(usuarios).toHaveLength(1);
      expect(usuarios[0].email).toBe('a@x.com');
      expect(usuarios[0].tokenVersion).toBe(0);
      expect(usuarios[0].passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
      expect(usuarios[0].passwordHash).not.toContain(SENHA_VALIDA);
    });

    it('normaliza o e-mail (trim e minúsculas) antes de gravar', async () => {
      const res = await registrar({
        email: '  Ana@X.COM ',
        password: SENHA_VALIDA,
      }).expect(201);

      expect(res.body.data.email).toBe('ana@x.com');
      expect((await prisma.user.findMany())[0].email).toBe('ana@x.com');
    });

    it('aceita senha acentuada', async () => {
      await registrar({ email: 'a@x.com', password: 'ação1234' }).expect(201);
      await registrar({ email: 'b@x.com', password: 'çççççççç1' }).expect(201);
      expect(await prisma.user.count()).toBe(2);
    });

    it('aceita senha de exatamente 72 bytes', async () => {
      await registrar({
        email: 'a@x.com',
        password: 'a'.repeat(71) + '1',
      }).expect(201);
    });
  });

  describe('cadastro inválido', () => {
    const casos: Array<[string, Record<string, unknown>, string]> = [
      [
        'e-mail em formato inválido',
        { email: 'nao-e-email', password: SENHA_VALIDA },
        'email',
      ],
      ['e-mail ausente', { password: SENHA_VALIDA }, 'email'],
      [
        'senha com 7 caracteres',
        { email: 'a@x.com', password: 'abcde12' },
        'password',
      ],
      [
        'senha com 73 bytes ASCII',
        { email: 'a@x.com', password: 'a'.repeat(72) + '1' },
        'password',
      ],
      [
        'senha com 37 caracteres multibyte (73 bytes)',
        { email: 'a@x.com', password: 'ç'.repeat(36) + '1' },
        'password',
      ],
      [
        'senha sem letra',
        { email: 'a@x.com', password: '12345678' },
        'password',
      ],
      [
        'senha sem número',
        { email: 'a@x.com', password: 'abcdefgh' },
        'password',
      ],
      ['senha ausente', { email: 'a@x.com' }, 'password'],
      [
        'senha que não é texto',
        { email: 'a@x.com', password: 12345678 },
        'password',
      ],
      [
        'campo extra',
        { email: 'a@x.com', password: SENHA_VALIDA, admin: true },
        'admin',
      ],
    ];

    it.each(casos)(
      '%s vira 400 com o campo em details e nada gravado',
      async (_nome, body, campo) => {
        const res = await registrar(body).expect(400);

        expect(res.body.statusCode).toBe(400);
        expect(res.body.details).toEqual(
          expect.arrayContaining([
            {
              field: campo,
              messages: expect.arrayContaining([expect.any(String)]),
            },
          ]),
        );
        expect(res.headers['set-cookie']).toBeUndefined();
        expect(JSON.stringify(res.body)).not.toContain(SENHA_VALIDA);
        expect(await prisma.user.count()).toBe(0);
      },
    );

    it('as mensagens de senha e e-mail estão em português', async () => {
      const res = await registrar({ email: 'ruim', password: 'abc' }).expect(
        400,
      );

      const mensagens = (res.body.details as Array<{ messages: string[] }>)
        .flatMap((d) => d.messages)
        .join(' ');
      expect(mensagens).toMatch(/e-mail/i);
      expect(mensagens).toMatch(/senha/i);
    });
  });
});
