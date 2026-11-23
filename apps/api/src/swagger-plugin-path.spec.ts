// Regressão da Issue #34: o plugin do Swagger gerava, no JS compilado, um import
// com o caminho do projeto corrompido quando esse caminho tem acento
// (`Usuário` virava `Usu/u00E1rio`), e `nest start` morria com ERR_MODULE_NOT_FOUND.
//
// O teste não depende de onde o repositório está clonado: ele copia os DTOs para
// uma pasta temporária com acento no nome, compila com o plugin e confere que todo
// import gerado pelo plugin aponta para um arquivo que existe.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { before as swaggerPlugin } from '@nestjs/swagger/plugin';
import ts from 'typescript';

const srcDir = dirname(fileURLToPath(import.meta.url));

function findDtos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findDtos(path);
    return entry.name.endsWith('.dto.ts') ? [path] : [];
  });
}

describe('plugin do Swagger em caminho com acento', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'Usuário-acentuação-'));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('não gera import quebrado nos DTOs compilados', () => {
    const copied = findDtos(srcDir).map((file) => {
      const target = join(root, 'src', relative(srcDir, file));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(file));
      return target;
    });
    // O projeto é ESM ("type": "module"); é nesse modo que o plugin gera o import.
    writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
    const outDir = join(root, 'dist');

    const program = ts.createProgram(copied, {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2023,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      skipLibCheck: true,
      rootDir: root,
      outDir,
    });
    program.emit(undefined, undefined, undefined, false, {
      before: [swaggerPlugin({ introspectComments: true }, program)],
    });

    const broken: string[] = [];
    for (const file of copied) {
      const emitted = join(outDir, relative(root, file)).replace(/\.ts$/, '.js');
      const js = readFileSync(emitted, 'utf8');
      for (const match of js.matchAll(/import \* as openapi_import_\d+ from "([^"]+)"/g)) {
        if (!existsSync(resolve(dirname(emitted), match[1]))) {
          broken.push(`${relative(root, emitted)} -> ${match[1]}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
