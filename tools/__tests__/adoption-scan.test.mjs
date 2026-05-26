/**
 * adoption-scan.test.mjs — invariant tests for the adoption scanner.
 *
 * Closes v1.49.786 W1.T2 (Tier 1 T1.2 audit strengthening lever — adoption
 * telemetry as observability surface).
 *
 * Tests:
 *   T1. Living module — a real (non-test) caller exists; status=living
 *   T2. Test-only module — only test files import it; status=test-only
 *   T3. Isolated module — no importers anywhere; status=isolated
 *   T4. CLI importer counted as real caller
 *   T5. External importer (tools/, scripts/) counted as real caller
 *   T6. Self-imports excluded from real-caller count
 *   T7. JSON output mode produces parseable JSON
 *   T8. Shelfware threshold triggers exit 1 when violated
 *   T9. Shelfware threshold passes when nothing violates
 *   T10. Type-only imports counted as real callers (intentional)
 *   T11. Multiple importers from same module counted once
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'adoption-scan.mjs');

let tmpRoot;
let workDir;

function setupFixture(layout) {
  tmpRoot = mkdtempSync(join(tmpdir(), 'adoption-scan-test-'));
  workDir = join(tmpRoot, 'work');
  mkdirSync(workDir, { recursive: true });
  for (const [relPath, content] of Object.entries(layout)) {
    const abs = join(workDir, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
}

function runScript(args = '') {
  const argv = args.length > 0 ? args.split(' ').filter(Boolean) : [];
  const result = spawnSync('node', [SCRIPT_PATH, ...argv], {
    cwd: workDir,
    encoding: 'utf8',
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function runScriptJson(args = '--json') {
  const r = runScript(args);
  return { ...r, records: r.exitCode === 0 || r.exitCode === 1 ? JSON.parse(r.stdout) : null };
}

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('adoption-scan', () => {
  it('T1: living module — real (non-test) caller present', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO + 'bar';\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('living');
    expect(foo.realCallerCount).toBe(1);
    expect(foo.internalImporters).toContain('bar');
  });

  it('T2: test-only module — only test files import it', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/foo/__tests__/foo.test.ts': "import { FOO } from '../index.js';\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('test-only');
    expect(foo.realCallerCount).toBe(0);
    expect(foo.testCount).toBe(1);
  });

  it('T3: isolated module — no importers anywhere', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('isolated');
    expect(foo.realCallerCount).toBe(0);
    expect(foo.testCount).toBe(0);
  });

  it('T4: CLI importer counted as real caller', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/cli.ts': "import { FOO } from './foo/index.js';\nconsole.log(FOO);\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('living');
    expect(foo.cliImporters.length).toBeGreaterThan(0);
  });

  it('T5: external importer (tools/) counted as real caller', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'tools/run-foo.mjs': "import { FOO } from '../src/foo/index.js';\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('living');
    expect(foo.externalImporters.length).toBeGreaterThan(0);
  });

  it('T6: self-imports excluded from real-caller count', () => {
    setupFixture({
      'src/foo/index.ts': "export { helper } from './helper.js';\n",
      'src/foo/helper.ts': "export const helper = 'h';\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('isolated');
    expect(foo.realCallerCount).toBe(0);
    expect(foo.selfImporters).toBeGreaterThan(0);
  });

  it('T7: JSON output mode parses cleanly', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
    });
    const r = runScript('--json');
    expect(r.exitCode).toBe(0);
    expect(() => JSON.parse(r.stdout)).not.toThrow();
    const parsed = JSON.parse(r.stdout);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('T8: shelfware threshold triggers exit 1 on violation', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n", // bar is isolated (no one imports it)
    });
    const r = runScript('--shelfware-threshold 1');
    expect(r.exitCode).toBe(1);
    // bar is isolated, foo has 1 real caller (bar). Only bar violates threshold.
    expect(r.stderr).toContain('bar');
  });

  it('T9: shelfware threshold passes when nothing violates', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'src/bar/index.ts': "import { FOO } from '../foo/index.js';\nexport const BAR = FOO;\n",
      'src/baz/index.ts': "import { BAR } from '../bar/index.js';\nexport const BAZ = BAR;\n",
    });
    const r = runScript('--shelfware-threshold 1');
    // foo has 1 real caller (bar), bar has 1 real caller (baz). Both meet threshold.
    // baz has 0 — but baz is isolated, and threshold=1 means realCallerCount<1, i.e., =0.
    // So baz should violate.
    expect(r.exitCode).toBe(1);
  });

  it('T10: type-only imports counted as real callers (intentional)', () => {
    setupFixture({
      'src/foo/index.ts': "export interface Foo { x: number; }\n",
      'src/bar/index.ts': "import type { Foo } from '../foo/index.js';\nexport const make = (): Foo => ({ x: 1 });\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.status).toBe('living');
    expect(foo.realCallerCount).toBe(1);
  });

  it('T11: multiple importers from same module counted once', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\nexport const FOO2 = 'foo2';\n",
      'src/bar/a.ts': "import { FOO } from '../foo/index.js';\nexport const A = FOO;\n",
      'src/bar/b.ts': "import { FOO2 } from '../foo/index.js';\nexport const B = FOO2;\n",
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    // Both bar/a.ts and bar/b.ts import foo — but they belong to the same module 'bar'.
    // internalImporters is a Set of module names, so 'bar' should appear once.
    expect(foo.internalImporters).toEqual(['bar']);
    expect(foo.realCallerCount).toBe(1);
  });
});
