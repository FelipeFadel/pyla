import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { normalizeName } from '../src/common/normalize-name.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('GET /products?search= (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let categoryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    }).compile();
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
    await prisma.user.deleteMany();
  }

  beforeEach(limpar);

  afterAll(async () => {
    // FKs Restrict para User: não deixar sobra para os outros arquivos.
    await limpar();
    await app.close();
  });

  const server = () => request(app.getHttpServer());

  async function sessao(email: string) {
    const res = await server()
      .post('/auth/register')
      .send({ email, password: 'senha1234' })
      .expect(201);
    return {
      cookie: (res.headers['set-cookie'] as unknown as string[])[0].split(
        ';',
      )[0],
      userId: res.body.data.id as string,
    };
  }

  const criarProdutos = (userId: string, names: string[]) =>
    prisma.product.createMany({
      data: names.map((name) => ({
        userId,
        name,
        normalizedName: normalizeName(name),
        categoryId,
      })),
    });

  const buscar = (cookie: string, search: string) =>
    server().get('/products').query({ search }).set('Cookie', cookie);

  const nomes = (res: { body: { data: { name: string }[] } }) =>
    res.body.data.map((p) => p.name);

  it('sem sessão: 401 (CA22)', async () => {
    await server().get('/products').query({ search: 'ar' }).expect(401);
  });

  it('devolve id, nome e categoria de cada produto (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    await criarProdutos(userId, ['Arroz']);
    const produto = await prisma.product.findFirstOrThrow({
      where: { userId },
    });

    const res = await buscar(cookie, 'arr');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      {
        id: produto.id,
        name: 'Arroz',
        category: { id: categoryId, name: 'Mercearia' },
      },
    ]);
  });

  it('acha pelo trecho do nome, sem diferenciar maiúsculas nem acentos (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    await criarProdutos(userId, [
      'Feijão Preto',
      'Açúcar',
      'Arroz',
      'Macarrão',
    ]);

    expect(nomes(await buscar(cookie, 'FEIJAO'))).toEqual(['Feijão Preto']);
    expect(nomes(await buscar(cookie, 'feijão'))).toEqual(['Feijão Preto']);
    expect(nomes(await buscar(cookie, 'acucar'))).toEqual(['Açúcar']);
    expect(nomes(await buscar(cookie, 'ÇÚC'))).toEqual(['Açúcar']);
    expect(nomes(await buscar(cookie, 'rrao'))).toEqual(['Macarrão']);
    expect(nomes(await buscar(cookie, '  preto  '))).toEqual(['Feijão Preto']);
  });

  it('termo que não casa devolve lista vazia (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    await criarProdutos(userId, ['Arroz']);

    const res = await buscar(cookie, 'zzz');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('ordena alfabeticamente ignorando maiúsculas e acentos (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    await criarProdutos(userId, ['Banana', 'arroz', 'Água', 'Abacate']);

    // 'a' casa com todos: Abacate, Água, arroz, Banana.
    const res = await buscar(cookie, 'a');

    expect(nomes(res)).toEqual(['Abacate', 'Água', 'arroz', 'Banana']);
  });

  it('devolve no máximo 20 produtos, os primeiros na ordem (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const lista = Array.from(
      { length: 25 },
      (_, i) => `Leite ${String(i + 1).padStart(2, '0')}`,
    );
    await criarProdutos(userId, lista);

    const res = await buscar(cookie, 'leite');

    expect(res.body.data).toHaveLength(20);
    expect(nomes(res)).toEqual(lista.slice(0, 20));
  });

  it('nunca mostra produto de outro usuário (CA20, RN21)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    const outro = await sessao('b@x.com');
    await criarProdutos(userId, ['Arroz Integral']);
    await criarProdutos(outro.userId, ['Arroz Branco', 'Arroz Integral']);

    const res = await buscar(cookie, 'arroz');

    expect(nomes(res)).toEqual(['Arroz Integral']);
    const meu = await prisma.product.findFirstOrThrow({ where: { userId } });
    expect(res.body.data[0].id).toBe(meu.id);
  });

  it('% e _ no termo valem como texto, não como curinga (CA20)', async () => {
    const { cookie, userId } = await sessao('a@x.com');
    await criarProdutos(userId, [
      'Suco 100% fruta',
      'Suco de uva',
      'a_b',
      'c\\d',
    ]);

    expect(nomes(await buscar(cookie, '%'))).toEqual(['Suco 100% fruta']);
    expect(nomes(await buscar(cookie, '\\'))).toEqual(['c\\d']);
    expect(nomes(await buscar(cookie, '_'))).toEqual(['a_b']);
    expect(nomes(await buscar(cookie, 'u_o'))).toEqual([]);
  });

  describe('termo inválido: 400, nunca 500', () => {
    it.each([
      ['vazio', ''],
      ['só espaços', '   '],
      ['só marcas combinantes', '́'],
      ['com NUL', 'ar\u0000roz'],
      ['acima de 80 caracteres', 'a'.repeat(81)],
    ])('%s', async (_nome, termo) => {
      const { cookie } = await sessao('a@x.com');

      const res = await buscar(cookie, termo);

      expect(res.status).toBe(400);
    });

    it('ausente', async () => {
      const { cookie } = await sessao('a@x.com');

      const res = await server().get('/products').set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('repetido (array)', async () => {
      const { cookie } = await sessao('a@x.com');

      const res = await server()
        .get('/products?search=a&search=b')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('objeto (search[a]=b)', async () => {
      const { cookie } = await sessao('a@x.com');

      const res = await server()
        .get('/products?search[a]=b')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('parâmetro desconhecido', async () => {
      const { cookie } = await sessao('a@x.com');

      const res = await server()
        .get('/products?search=a&userId=x')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('80 caracteres é aceito', async () => {
      const { cookie } = await sessao('a@x.com');

      const res = await buscar(cookie, 'a'.repeat(80));

      expect(res.status).toBe(200);
    });
  });
});
