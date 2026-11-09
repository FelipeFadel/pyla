/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pastaSrc = dirname(fileURLToPath(import.meta.url));

// Prefixo de largura/altura + nome da escala de espaçamento, com variantes (sm:, md:).
// O lookbehind impede contar o `w-` de dentro de `max-w-`/`min-w-` e `gap-md`, `p-sm` não casam.
const usoDeEspacamentoComoTamanho =
  /(?<![\w-])(?:(?:[\w-]+:)*)(?:max-w|min-w|w|h|size)-(?:xxs|xs|sm|md|lg|xl)(?![\w-])/g;

function acharUsosInvalidos(texto: string): string[] {
  return texto.match(usoDeEspacamentoComoTamanho) ?? [];
}

function listarTsx(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarTsx(caminho);
    const ehTsx = entrada.name.endsWith('.tsx') && !entrada.name.endsWith('.test.tsx');
    return ehTsx ? [caminho] : [];
  });
}

describe('regex de largura com nome de espaçamento', () => {
  it.each(['max-w-md', 'sm:max-w-md', 'md:w-lg', 'min-w-xs', 'h-xl', 'size-sm', 'md:hover:w-xxs'])(
    'pega %s',
    (classe) => {
      expect(acharUsosInvalidos(`<main className="flex ${classe} p-sm">`)).toHaveLength(1);
    },
  );

  it.each(['gap-md', 'p-sm', 'pt-xl', 'text-corpo', 'max-w-formulario', 'w-full', 'mx-auto'])(
    'ignora %s',
    (classe) => {
      expect(acharUsosInvalidos(`<main className="${classe}">`)).toHaveLength(0);
    },
  );

  it('conta max-w-md uma única vez', () => {
    expect(acharUsosInvalidos('max-w-md')).toHaveLength(1);
  });
});

describe('largura das telas', () => {
  it('o @theme declara o token de container do formulário', () => {
    const css = readFileSync(join(pastaSrc, 'index.css'), 'utf-8');
    const tema = css.match(/@theme\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(tema).toMatch(/--container-formulario:\s*28rem;/);
  });

  it('nenhum .tsx usa nome de espaçamento como largura/altura', () => {
    const usos = listarTsx(pastaSrc).flatMap((arquivo) =>
      acharUsosInvalidos(readFileSync(arquivo, 'utf-8')).map((uso) => `${arquivo}: ${uso}`),
    );
    expect(usos).toEqual([]);
  });
});
