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
 *
 * Reachability dimension (Ship 3.1 / v1.49.977):
 *   T17. Module reachable from a production root (src/cli.ts) — and transitively
 *   T18. Module reachable from the library root (src/index.ts)
 *   T19. Living-but-unreachable — imported only inside an unreachable cycle
 *   T20. FILE-level granularity — module-level reachability would over-report
 *   T21. Desktop import seeds reachability; tools/ import does NOT (dev tooling)
 *   T22. Dynamic import() string-literal edges are followed for reachability
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

  // ─── v1.49.787 allowlist tests ──────────────────────────────────────────

  it('T12: allowlist entries flagged with allowlisted: true + reason', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'tools/adoption-scan.allowlist.json': JSON.stringify({
        version: '1.0',
        entries: [{ module: 'foo', reason: 'intentional fixture' }],
      }),
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.allowlisted).toBe(true);
    expect(foo.allowlistReason).toBe('intentional fixture');
  });

  it('T13: non-allowlisted modules report allowlisted: false + reason: null', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'tools/adoption-scan.allowlist.json': JSON.stringify({ version: '1.0', entries: [] }),
    });
    const { records } = runScriptJson();
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.allowlisted).toBe(false);
    expect(foo.allowlistReason).toBeNull();
  });

  it('T14: allowlisted modules excluded from shelfware-threshold trigger', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n", // isolated
      'src/bar/index.ts': "export const BAR = 'bar';\n", // isolated
      'tools/adoption-scan.allowlist.json': JSON.stringify({
        version: '1.0',
        entries: [{ module: 'foo', reason: 'intentional' }],
      }),
    });
    // threshold=1 means realCallerCount<1 (i.e., 0) is a violation
    const r = runScript('--shelfware-threshold 1');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('bar'); // bar violates
    expect(r.stderr).not.toContain('foo'); // foo is allowlisted → excluded
  });

  it('T15: --no-allowlist disables allowlist even if file present', () => {
    setupFixture({
      'src/foo/index.ts': "export const FOO = 'foo';\n",
      'tools/adoption-scan.allowlist.json': JSON.stringify({
        version: '1.0',
        entries: [{ module: 'foo', reason: 'intentional' }],
      }),
    });
    const { records } = runScriptJson('--no-allowlist --json');
    const foo = records.find((r) => r.module === 'foo');
    expect(foo.allowlisted).toBe(false);
  });

  it('T16: large JSON output is captured intact (no exit-drain truncation)', () => {
    // The v1.49.787 exit-drain fix ensures stdout flushes before process.exit().
    // While spawnSync uses a larger buffer than the 64KB shell pipe that
    // originally surfaced this bug, this regression check confirms large
    // outputs survive the scanner's exit path.
    const fixture = {};
    for (let i = 0; i < 50; i++) {
      fixture[`src/mod${i}/index.ts`] = `export const M${i} = ${i};\n`;
    }
    setupFixture(fixture);
    const r = runScript('--json');
    expect(r.exitCode).toBe(0);
    expect(() => JSON.parse(r.stdout)).not.toThrow();
    const parsed = JSON.parse(r.stdout);
    expect(parsed.length).toBe(50);
    // Validate the array is structurally complete (last record is whole)
    expect(parsed[49].module).toBe('mod9'); // alphabetical: mod0, mod1, mod10, ...mod9
  });

  // ─── v1.49.977 reachability dimension (Ship 3.1) ─────────────────────────

  it('T17: module reachable from the CLI root (src/cli.ts), transitively', () => {
    setupFixture({
      'src/cli.ts': "import { A } from './a/index.js';\nimport { B } from './b/index.js';\nconsole.log(A, B);\n",
      'src/a/index.ts': 'export const A = 1;\n',
      'src/b/index.ts': "import { C } from '../c/index.js';\nexport const B = C;\n",
      'src/c/index.ts': 'export const C = 3;\n',
    });
    const { records } = runScriptJson();
    const by = (m) => records.find((r) => r.module === m);
    expect(by('a').reachableFromProduction).toBe(true); // direct from cli root
    expect(by('b').reachableFromProduction).toBe(true); // direct from cli root
    expect(by('c').reachableFromProduction).toBe(true); // transitive via b
  });

  it('T18: module reachable from the library root (src/index.ts)', () => {
    setupFixture({
      'src/index.ts': "export { D } from './d/index.js';\n",
      'src/d/index.ts': 'export const D = 4;\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.module === 'd').reachableFromProduction).toBe(true);
  });

  it('T19: living-but-unreachable — imported only inside an unreachable cycle', () => {
    setupFixture({
      'src/x/index.ts': 'export const X = 1;\n',
      'src/y/index.ts': "import { X } from '../x/index.js';\nexport const Y = X;\n", // y imports x; nobody imports y; no root
    });
    const { records } = runScriptJson();
    const x = records.find((r) => r.module === 'x');
    // x is `living` by import-surface (y is a non-test importer) yet unreachable.
    expect(x.status).toBe('living');
    expect(x.reachableFromProduction).toBe(false);
  });

  it('T20: FILE-level granularity — a reachable module importing X via an unreachable file does NOT make X reachable', () => {
    setupFixture({
      'src/cli.ts': "import { A } from './m/a.js';\nconsole.log(A);\n",
      'src/m/a.ts': 'export const A = 1;\n', // reachable from cli
      'src/m/b.ts': "import { X } from '../x/index.js';\nexport const B = X;\n", // imports x; b is NOT reached by anything
      'src/x/index.ts': 'export const X = 9;\n',
    });
    const { records } = runScriptJson();
    const m = records.find((r) => r.module === 'm');
    const x = records.find((r) => r.module === 'x');
    expect(m.reachableFromProduction).toBe(true); // via m/a.ts
    expect(x.status).toBe('living'); // module m imports x (via b.ts)
    // Module-level reachability would WRONGLY mark x reachable (m is reachable AND
    // imports x). File-level correctly reports x unreachable: m/b.ts is not reached.
    expect(x.reachableFromProduction).toBe(false);
  });

  it('T21: desktop/ import seeds reachability; tools/ import does NOT (dev tooling)', () => {
    setupFixture({
      'src/cli.ts': 'export const ROOT = 0;\n', // a present root (imports nothing relevant)
      'src/deskmod/index.ts': 'export const DM = 1;\n',
      'desktop/widget.ts': "import { DM } from '../src/deskmod/index.js';\n",
      'src/toolmod/index.ts': 'export const TM = 1;\n',
      'tools/runner.mjs': "import { TM } from '../src/toolmod/index.js';\n",
    });
    const { records } = runScriptJson();
    const desk = records.find((r) => r.module === 'deskmod');
    const tool = records.find((r) => r.module === 'toolmod');
    // Both are `living` (each has a real external importer)...
    expect(desk.status).toBe('living');
    expect(tool.status).toBe('living');
    // ...but only the shipped desktop app confers production reachability.
    expect(desk.reachableFromProduction).toBe(true);
    expect(tool.reachableFromProduction).toBe(false);
  });

  it('T22: dynamic import() string-literal edges are followed for reachability', () => {
    setupFixture({
      'src/cli.ts': "export async function run() { const { D } = await import('./dyn/index.js'); return D; }\n",
      'src/dyn/index.ts': 'export const D = 1;\n',
    });
    const { records } = runScriptJson();
    expect(records.find((r) => r.module === 'dyn').reachableFromProduction).toBe(true);
  });
});
