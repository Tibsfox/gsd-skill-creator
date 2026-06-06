import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { walkProjectFiles } from '../file-walker.js';

// walkProjectFiles returns absolute paths. Relativize against `root` and
// normalize the platform separator to '/' so the canonical comparison holds
// on win32 (path.relative emits backslashes there; no-op on POSIX).
function relPath(root: string, abs: string): string {
  return relative(root, abs).split(sep).join('/');
}
import {
  CapturingAuditSink,
  defaultLoaderContext,
  LoaderContextDenied,
  type LoaderContext,
} from '../../../security/loader-context.js';

let root: string;

function touch(rel: string, body = ''): void {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, body);
}

beforeEach(() => {
  // realpath so root matches walkProjectFiles' realpath-normalized output —
  // on macOS tmpdir() is under /var → /private/var (no-op on Linux).
  root = realpathSync(mkdtempSync(join(tmpdir(), 'atlas-walker-')));
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
    const rels = out.map((p) => relPath(root, p)).sort();
    expect(rels).toEqual(['src/a.ts', 'src/b.py']);
  });

  it('respects caller fileFilter', async () => {
    touch('src/keep.ts', '');
    touch('src/drop.ts', '');
    const out = await walkProjectFiles(root, {
      fileFilter: (rel) => !rel.endsWith('drop.ts'),
    });
    const rels = out.map((p) => relPath(root, p)).sort();
    expect(rels).toEqual(['src/keep.ts']);
  });

  it('skips files larger than maxFileBytes', async () => {
    touch('src/big.ts', 'x'.repeat(2048));
    touch('src/small.ts', 'y');
    const out = await walkProjectFiles(root, { maxFileBytes: 100 });
    const rels = out.map((p) => relPath(root, p));
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

  describe('LoaderContext chokepoint integration (v1.49.889)', () => {
    it('emits exactly one audit record per walkProjectFiles call when ctx is provided', async () => {
      touch('src/a.ts', '');
      touch('src/b.ts', '');
      const sink = new CapturingAuditSink();
      await walkProjectFiles(root, { ctx: defaultLoaderContext(sink) });
      expect(sink.records).toHaveLength(1);
      const rec = sink.records[0];
      expect(rec.source).toBe('atlas-indexer/file-walker');
      expect(rec.op).toBe('read-dir');
      expect(rec.target).toBe(root);
      expect(rec.allowed).toBe(true);
    });

    it('emits one audit record regardless of file/directory count', async () => {
      touch('src/a.ts', '');
      touch('src/b.ts', '');
      touch('src/deep/c.ts', '');
      touch('src/deep/deeper/d.ts', '');
      const sink = new CapturingAuditSink();
      await walkProjectFiles(root, { ctx: defaultLoaderContext(sink) });
      expect(sink.records).toHaveLength(1);
    });

    it('throws LoaderContextDenied when root is not in allowList', async () => {
      const sink = new CapturingAuditSink();
      const restrictedCtx: LoaderContext = {
        allowList: ['/somewhere/that/does/not/match'],
        audit: sink,
      };
      await expect(walkProjectFiles(root, { ctx: restrictedCtx })).rejects.toBeInstanceOf(LoaderContextDenied);
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0].allowed).toBe(false);
    });

    it('legacy permissive mode when ctx is undefined (no audit)', async () => {
      touch('src/a.ts', '');
      const out = await walkProjectFiles(root);
      expect(out.length).toBe(1);
    });

    it('admits root via prefix-pattern (trailing slash) in allowList', async () => {
      touch('src/a.ts', '');
      const sink = new CapturingAuditSink();
      const prefixCtx: LoaderContext = {
        allowList: [`${root}/`],
        audit: sink,
      };
      await walkProjectFiles(root, { ctx: prefixCtx });
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0].allowed).toBe(true);
    });

    it('rejects denial BEFORE attempting realpath (denied path may not exist)', async () => {
      const sink = new CapturingAuditSink();
      const restrictedCtx: LoaderContext = {
        allowList: ['/explicitly/only/this'],
        audit: sink,
      };
      const nonexistent = join(root, 'never-created-dir');
      await expect(walkProjectFiles(nonexistent, { ctx: restrictedCtx })).rejects.toBeInstanceOf(LoaderContextDenied);
    });
  });
});
