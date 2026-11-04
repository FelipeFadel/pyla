import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Body, Controller, Get, INestApplication, Post } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { IsEmail, IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { configureApp } from '../src/common/setup-app.js';

// Controller e DTO só de teste: exercitam a configuração global real.
class ProbeDto {
  @IsEmail({}, { message: 'e-mail inválido' })
  email: string;

  @IsString({ message: 'nome inválido' })
  name: string;
}

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() dto: ProbeDto) {
    return { email: dto.email, name: dto.name };
  }

  @Get('boom')
  boom(): never {
    throw new Error('segredo interno: select * from "User"');
  }
}

describe('Base global da API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    vi.stubEnv('WEB_ORIGIN', 'http://localhost:5173');
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('envolve o sucesso em { data }', async () => {
    const res = await request(app.getHttpServer())
      .post('/probe')
      .send({ email: 'a@x.com', name: 'Ana' })
      .expect(201);

    expect(res.body).toEqual({ data: { email: 'a@x.com', name: 'Ana' } });
  });

  it('campo inválido vira 400 com details por campo', async () => {
    const res = await request(app.getHttpServer())
      .post('/probe')
      .send({ email: 'nao-e-email', name: 'Ana' })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      path: '/probe',
      details: [{ field: 'email', messages: ['e-mail inválido'] }],
    });
    expect(typeof res.body.message).toBe('string');
    expect(typeof res.body.timestamp).toBe('string');
    expect(res.body.data).toBeUndefined();
  });

  it('campo extra vira 400 apontando o campo', async () => {
    const res = await request(app.getHttpServer())
      .post('/probe')
      .send({ email: 'a@x.com', name: 'Ana', admin: true })
      .expect(400);

    expect(res.body.details).toEqual([
      { field: 'admin', messages: expect.any(Array) },
    ]);
  });

  it('erro desconhecido vira 500 genérico, sem stack nem texto interno', async () => {
    const res = await request(app.getHttpServer()).get('/probe/boom').expect(500);

    expect(res.body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
      path: '/probe/boom',
    });
    expect(res.body.details).toBeUndefined();
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain('segredo interno');
    expect(texto).not.toContain('select');
    expect(texto).not.toContain(' at ');
  });

  it('rota inexistente vira 404 em português no mesmo formato', async () => {
    const res = await request(app.getHttpServer()).get('/nao-existe').expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Recurso não encontrado.',
      path: '/nao-existe',
    });
  });

  it('CORS aceita só a WEB_ORIGIN, com credentials', async () => {
    const ok = await request(app.getHttpServer())
      .get('/probe/boom')
      .set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(ok.headers['access-control-allow-credentials']).toBe('true');

    const outra = await request(app.getHttpServer())
      .get('/probe/boom')
      .set('Origin', 'http://outro.com');
    expect(outra.headers['access-control-allow-origin']).not.toBe(
      'http://outro.com',
    );
  });
});

describe('Validação das variáveis de ambiente no boot (e2e)', () => {
  // O ConfigModule v12 valida de forma assíncrona: a falha aparece quando o
  // Nest monta o módulo (o mesmo passo do NestFactory.create), não no import.
  async function subirAppModule() {
    vi.resetModules();
    const { AppModule } = await import('../src/app.module.js');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.close();
  }

  // O ConfigModule lê o .env a partir de process.cwd(). Rodar num diretório sem
  // .env deixa o teste independente do .env de quem o executa.
  const cwdOriginal = process.cwd();
  let dirSemEnv: string;

  beforeAll(() => {
    dirSemEnv = mkdtempSync(join(tmpdir(), 'pyla-sem-env-'));
    process.chdir(dirSemEnv);
  });

  afterAll(() => {
    process.chdir(cwdOriginal);
    rmSync(dirSemEnv, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgresql://teste:teste@localhost:5432/teste');
    vi.stubEnv('JWT_SECRET', 'segredo-de-teste');
    vi.stubEnv('WEB_ORIGIN', 'http://localhost:5173');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sobe com todas as variáveis obrigatórias', async () => {
    await expect(subirAppModule()).resolves.toBeUndefined();
  });

  it('falha o boot sem JWT_SECRET', async () => {
    vi.stubEnv('JWT_SECRET', undefined);

    await expect(subirAppModule()).rejects.toThrow(/JWT_SECRET/);
  });

  it('o erro lista tudo o que falta', async () => {
    vi.stubEnv('JWT_SECRET', undefined);
    vi.stubEnv('WEB_ORIGIN', undefined);
    vi.stubEnv('DATABASE_URL', ''); // vazio vale como ausente

    const erro = await subirAppModule().catch((e: Error) => e);
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).toContain('DATABASE_URL');
    expect((erro as Error).message).toContain('JWT_SECRET');
    expect((erro as Error).message).toContain('WEB_ORIGIN');
  });
});
