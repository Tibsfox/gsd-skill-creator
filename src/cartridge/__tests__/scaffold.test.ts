/**
 * Scaffold tests — SF-01..SF-04.
 *
 * SF-01 scaffold a department cartridge, load it through the loader, and
 *       assert the validator returns no errors.
 * SF-02 scaffold a content cartridge and round-trip through the schema.
 * SF-03 scaffold a coprocessor cartridge and round-trip through the schema.
 * SF-04 refuse to scaffold into a non-empty target directory.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCartridge } from '../loader.js';
import { scaffoldCartridge } from '../scaffold.js';
import { CartridgeSchema } from '../types.js';
import { validateCartridge } from '../validator.js';

const tmpRoots: string[] = [];

function freshDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cartridge-scaffold-'));
  tmpRoots.push(dir);
  return dir;
}

afterEach(() => {
  while (tmpRoots.length > 0) {
    const dir = tmpRoots.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('scaffoldCartridge', () => {
  it('SF-01 department scaffold loads and validates green', () => {
    const root = freshDir();
    const target = join(root, 'my-dept');

    const result = scaffoldCartridge({
      template: 'department',
      targetDir: target,
      name: 'my-dept',
    });

    expect(result.targetDir).toBe(target);
    expect(result.filesWritten).toContain('cartridge.yaml');
    expect(result.filesWritten).toContain('chipsets/department.yaml');
    expect(result.filesWritten).toContain('chipsets/grove.yaml');
    expect(result.filesWritten).toContain('chipsets/evaluation.yaml');
    expect(result.filesWritten).toContain('README.md');

    const cartridge = loadCartridge(join(target, 'cartridge.yaml'));
    expect(cartridge.id).toBe('my-dept');
    expect(cartridge.name).toBe('my-dept');
    expect(cartridge.trust).toBe('user');
    expect(cartridge.chipsets).toHaveLength(3);

    const kinds = cartridge.chipsets.map((c) => c.kind).sort();
    expect(kinds).toEqual(['department', 'evaluation', 'grove']);

    const v = validateCartridge(cartridge);
    expect(v.errors).toEqual([]);
    expect(v.valid).toBe(true);
  });

  it('SF-02 content scaffold round-trips through the schema', () => {
    const root = freshDir();
    const target = join(root, 'my-content');

    scaffoldCartridge({
      template: 'content',
      targetDir: target,
      name: 'my-content',
      trust: 'community',
    });

    const cartridge = loadCartridge(join(target, 'cartridge.yaml'));
    expect(cartridge.trust).toBe('community');

    const kinds = cartridge.chipsets.map((c) => c.kind).sort();
    expect(kinds).toEqual(['content', 'voice']);

    const parsed = CartridgeSchema.parse(cartridge);
    expect(parsed.id).toBe('my-content');
  });

  it('SF-03 coprocessor scaffold round-trips through the schema', () => {
    const root = freshDir();
    const target = join(root, 'my-coproc');

    scaffoldCartridge({
      template: 'coprocessor',
      targetDir: target,
      name: 'my-coproc',
    });

    const cartridge = loadCartridge(join(target, 'cartridge.yaml'));
    expect(cartridge.chipsets).toHaveLength(1);
    expect(cartridge.chipsets[0]?.kind).toBe('coprocessor');

    const parsed = CartridgeSchema.parse(cartridge);
    expect(parsed.id).toBe('my-coproc');
  });

  it('SF-05 graphics scaffold produces shader files + cartridge.yaml and validates green', () => {
    const root = freshDir();
    const target = join(root, 'my-gfx');

    const result = scaffoldCartridge({
      template: 'graphics',
      targetDir: target,
      name: 'my-gfx',
    });

    expect(result.filesWritten).toContain('cartridge.yaml');
    expect(result.filesWritten).toContain('README.md');
    expect(result.filesWritten).toContain('shaders/basic.vert.glsl');
    expect(result.filesWritten).toContain('shaders/basic.frag.glsl');

    const cartridge = loadCartridge(join(target, 'cartridge.yaml'));
    expect(cartridge.chipsets).toHaveLength(1);
    expect(cartridge.chipsets[0]?.kind).toBe('graphics');

    const v = validateCartridge(cartridge);
    expect(v.errors).toEqual([]);
    expect(v.valid).toBe(true);

    // Round-trip through the schema too.
    const parsed = CartridgeSchema.parse(cartridge);
    expect(parsed.id).toBe('my-gfx');

    // Shader files actually exist and contain the GLSL ES 3.00 header.
    const vert = readFileSync(join(target, 'shaders/basic.vert.glsl'), 'utf8');
    const frag = readFileSync(join(target, 'shaders/basic.frag.glsl'), 'utf8');
    expect(vert).toContain('#version 300 es');
    expect(frag).toContain('#version 300 es');
    expect(frag).toContain('precision mediump float');
  });

  it('SF-04 refuses to scaffold into a non-empty target directory', () => {
    const root = freshDir();
    const target = join(root, 'occupied');
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'existing.txt'), 'do not overwrite', 'utf8');

    expect(() =>
      scaffoldCartridge({
        template: 'department',
        targetDir: target,
        name: 'occupied',
      }),
    ).toThrow(/not empty/);

    const preserved = readFileSync(join(target, 'existing.txt'), 'utf8');
    expect(preserved).toBe('do not overwrite');
  });

  it('SF-04b rejects invalid cartridge names', () => {
    const root = freshDir();
    expect(() =>
      scaffoldCartridge({
        template: 'department',
        targetDir: join(root, 'bad'),
        name: 'Bad_Name',
      }),
    ).toThrow(/invalid cartridge name/);
  });
});
