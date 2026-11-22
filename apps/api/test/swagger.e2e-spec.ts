import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/setup-app.js';
import { setupSwagger } from '../src/common/swagger.js';

type Schema = {
  type?: string;
  $ref?: string;
  allOf?: unknown[];
  oneOf?: unknown[];
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
};
type Operation = {
  summary?: string;
  parameters?: { name: string; in: string }[];
  requestBody?: {
    content: Record<string, { schema: { $ref?: string } }>;
  };
  responses: Record<
    string,
    { content?: Record<string, { schema: { $ref?: string } }> }
  >;
};

// Campos esperados de cada schema da história 003 (CA24), escritos à mão a
// partir dos DTOs: se um campo sumir da documentação, o teste falha.
const ESPERADO: Record<string, string[]> = {
  CreatePurchaseDto: [
    'date',
    'storeId',
    'storeName',
    'paidTotalCents',
    'items',
  ],
  CreatePurchaseItemDto: [
    'productId',
    'name',
    'categoryId',
    'quantity',
    'packageSize',
    'unit',
    'fullPriceCents',
    'discountCents',
  ],
  PurchaseEnvelopeDto: ['data'],
  PurchaseDto: [
    'id',
    'date',
    'status',
    'store',
    'items',
    'itemsTotalCents',
    'cashDiscountCents',
    'totalCents',
  ],
  PurchaseStoreDto: ['id', 'name'],
  PurchaseItemDto: [
    'id',
    'product',
    'quantity',
    'packageSize',
    'unit',
    'fullPriceCents',
    'discountCents',
    'valueCents',
  ],
  PurchaseItemProductDto: ['id', 'name', 'categoryId', 'category'],
  PurchaseItemCategoryDto: ['id', 'name'],
  PurchaseListEnvelopeDto: ['data'],
  PurchaseSummaryDto: ['id', 'date', 'store', 'totalCents', 'itemsCount'],
  ProductListEnvelopeDto: ['data'],
  ProductSummaryDto: ['id', 'name', 'category'],
  ProductCategoryDto: ['id', 'name'],
  CategoryListEnvelopeDto: ['data'],
  CategoryDto: ['id', 'name'],
};

const ROTAS: [string, string][] = [
  ['/categories', 'get'],
  ['/products', 'get'],
  ['/purchases', 'get'],
  ['/purchases', 'post'],
  ['/purchases/{id}', 'get'],
];

describe('Swagger da história de compra (e2e, CA24)', () => {
  let app: INestApplication<App>;
  let doc: {
    paths: Record<string, Record<string, Operation>>;
    components: { schemas: Record<string, Schema> };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    setupSwagger(app);
    await app.init();
    const res = await request(app.getHttpServer()).get('/docs-json');
    expect(res.status).toBe(200);
    doc = res.body;
  });

  afterAll(async () => {
    await app.close();
  });

  const nomeDe = (ref: string) => ref.split('/').pop() as string;

  // Segue $ref, allOf/oneOf, items e properties, juntando todos os schemas
  // alcançáveis a partir de um ponto de entrada.
  function alcancaveis(nome: string, vistos = new Set<string>()) {
    if (vistos.has(nome)) return vistos;
    vistos.add(nome);
    const visita = (s: Schema | undefined) => {
      if (!s) return;
      if (s.$ref) alcancaveis(nomeDe(s.$ref), vistos);
      [...(s.allOf ?? []), ...(s.oneOf ?? [])].forEach((x) =>
        visita(x as Schema),
      );
      visita(s.items);
      Object.values(s.properties ?? {}).forEach(visita);
    };
    const schema = doc.components.schemas[nome];
    Object.values(schema?.properties ?? {}).forEach(visita);
    return vistos;
  }

  it('todas as rotas da história aparecem', () => {
    for (const [caminho, metodo] of ROTAS) {
      expect(
        doc.paths[caminho]?.[metodo],
        `${metodo} ${caminho}`,
      ).toBeDefined();
      expect(doc.paths[caminho][metodo].summary).toBeTruthy();
    }
  });

  it('a busca de produtos documenta o parâmetro search', () => {
    const params = doc.paths['/products'].get.parameters ?? [];
    expect(params).toContainEqual(
      expect.objectContaining({ name: 'search', in: 'query' }),
    );
  });

  it('as respostas documentadas e o corpo do POST apontam para schemas', () => {
    const post = doc.paths['/purchases'].post;
    const corpo = post.requestBody?.content['application/json'].schema.$ref;
    expect(corpo && nomeDe(corpo)).toBe('CreatePurchaseDto');
    expect(
      nomeDe(post.responses['201'].content!['application/json'].schema.$ref!),
    ).toBe('PurchaseEnvelopeDto');
    expect(
      nomeDe(
        doc.paths['/purchases'].get.responses['200'].content![
          'application/json'
        ].schema.$ref!,
      ),
    ).toBe('PurchaseListEnvelopeDto');
    expect(
      nomeDe(
        doc.paths['/purchases/{id}'].get.responses['200'].content![
          'application/json'
        ].schema.$ref!,
      ),
    ).toBe('PurchaseEnvelopeDto');
    expect(
      nomeDe(
        doc.paths['/products'].get.responses['200'].content!['application/json']
          .schema.$ref!,
      ),
    ).toBe('ProductListEnvelopeDto');
    expect(
      nomeDe(
        doc.paths['/categories'].get.responses['200'].content![
          'application/json'
        ].schema.$ref!,
      ),
    ).toBe('CategoryListEnvelopeDto');
  });

  it('os schemas alcançáveis pelas rotas são exatamente os esperados', () => {
    const todos = new Set<string>();
    const entradas = [
      'CreatePurchaseDto',
      'PurchaseEnvelopeDto',
      'PurchaseListEnvelopeDto',
      'ProductListEnvelopeDto',
      'CategoryListEnvelopeDto',
    ];
    entradas.forEach((e) => alcancaveis(e, todos));
    expect([...todos].sort()).toEqual(Object.keys(ESPERADO).sort());
  });

  describe.each(Object.entries(ESPERADO))('schema %s', (nome, campos) => {
    it('lista todos os campos esperados, cada um com tipo', () => {
      const schema = doc.components.schemas[nome];
      expect(schema, `schema ${nome}`).toBeDefined();
      const props = schema.properties ?? {};
      expect(Object.keys(props).sort()).toEqual([...campos].sort());
      for (const [campo, def] of Object.entries(props)) {
        const temTipo =
          def.type !== undefined ||
          def.$ref !== undefined ||
          def.allOf !== undefined ||
          def.oneOf !== undefined;
        expect(temTipo, `${nome}.${campo} sem type/$ref`).toBe(true);
      }
    });
  });

  it('os campos de dinheiro, quantidade e lista têm o tipo certo', () => {
    const s = doc.components.schemas;
    expect(s.CreatePurchaseItemDto.properties!.quantity.type).toBe('number');
    expect(s.CreatePurchaseItemDto.properties!.unit.type).toBe('string');
    expect(s.PurchaseItemDto.properties!.valueCents.type).toBe('number');
    expect(s.PurchaseItemDto.properties!.packageSize.type).toBe('number');
    expect(s.PurchaseDto.properties!.items.type).toBe('array');
    expect(s.PurchaseSummaryDto.properties!.itemsCount.type).toBe('number');
    expect(s.CreatePurchaseDto.properties!.items.type).toBe('array');
    expect(s.PurchaseListEnvelopeDto.properties!.data.type).toBe('array');
    expect(s.ProductListEnvelopeDto.properties!.data.type).toBe('array');
    expect(s.CategoryListEnvelopeDto.properties!.data.type).toBe('array');
  });
});
