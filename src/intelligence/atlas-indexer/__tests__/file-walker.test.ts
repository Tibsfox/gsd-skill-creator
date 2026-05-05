import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { walkProjectFiles } from '../file-walker.js';

let root: string;

function touch(rel: string, body = ''): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atlas-walker-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('atlas-indexer walkProjectFiles', () => {
  it('walks regular files and ignores skip-set directories', async () => {
    touch('src/a.ts', 'export const a = 1;');
    touch('src/b.py', '');
    touch('node_modules/pkg/index.js', '');
    touch('.git/HEAD', '');
    touch('dist/bundle.js', '');
    touch('target/debug/x', '');
    touch('__pycache__/x.pyc', '');

    const out = await walkProjectFiles(root);
    const rels = out.map((p) => p.slice(root.length + 1)).sort();
    expect(rels).toEqual(['src/a.ts', 'src/b.py']);
  });

  it('respects caller fileFilter', async () => {
    touch('src/keep.ts', '');
    touch('src/drop.ts', '');
    const out = await walkProjectFiles(root, {
      fileFilter: (rel) => !rel.endsWith('drop.ts'),
    });
    const rels = out.map((p) => p.slice(root.length + 1)).sort();
    expect(rels).toEqual(['src/keep.ts']);
  });

  it('skips files larger than maxFileBytes', async () => {
    touch('src/big.ts', 'x'.repeat(2048));
    touch('src/small.ts', 'y');
    const out = await walkProjectFiles(root, { maxFileBytes: 100 });
    const rels = out.map((p) => p.slice(root.length + 1));
    expect(rels).toContain('src/small.ts');
    expect(rels).not.toContain('src/big.ts');
  });

  it('honors maxDepth', async () => {
    touch('a/b/c/d/e/leaf.ts', 'x');
    const shallow = await walkProjectFiles(root, { maxDepth: 2 });
    const deep = await walkProjectFiles(root, { maxDepth: 32 });
    expect(shallow.length).toBe(0);
    expect(deep.length).toBe(1);
  });

  it('returns empty for nonexistent root rather than throwing', async () => {
    const out = await walkProjectFiles(join(root, 'does-not-exist'));
    expect(out).toEqual([]);
  });
});
