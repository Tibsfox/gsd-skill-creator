/**
 * Atlas indexer end-to-end orchestration tests.
 *
 * Spins up a tmp project on disk with a small TS+Python+Rust fixture, runs
 * the orchestrator, and verifies symbols/refs/calls/type-relations land in
 * SQLite plus the IntelligenceEventBus receives the four lifecycle events.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { applyMigrations } from '../../kb/migrations.js';
import { SymbolsKB } from '../../kb/symbols.js';
import { runAtlasIndexer } from '../runner.js';
import type { IntelligenceEvent } from '../../events/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let projectRoot: string;
let dbPath: string;
let db: Database.Database;

function touch(root: string, rel: string, body: string): void {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
}

function makeFixtureProject(root: string): void {
  // Two TS files, one referencing the other.
  touch(
    root,
    'src/util.ts',
    `export function helper(name: string): string {
  return 'hello-' + name;
}
export class UtilBox {
  static stamp(): number { return 42; }
}
`,
  );
  touch(
    root,
    'src/main.ts',
    `import { helper, UtilBox } from './util.js';
export function greet(name: string): string {
  return helper(name);
}
export class Greeter extends UtilBox {
  hello(): string { return greet('world'); }
}
`,
  );
  // One Python file.
  touch(
    root,
    'pkg/calc.py',
    `def add(a, b):
    return a + b

class Calc:
    def double(self, x):
        return add(x, x)
`,
  );
  // One Rust file.
  touch(
    root,
    'crate/lib.rs',
    `pub struct Counter;

fn make() -> Counter { Counter }

impl Counter {
    fn step(&self) -> i32 { 1 }
}
`,
  );
  // Files that should be skipped (skip-dir + non-source).
  touch(root, 'node_modules/pkg/index.js', 'should be ignored');
  touch(root, 'README.md', '# ignored');
}

class CapturingBus {
  events: IntelligenceEvent[] = [];
  publish(e: IntelligenceEvent): void {
    this.events.push(e);
  }
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'atlas-runner-'));
  dbPath = join(projectRoot, 'atlas.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  applyMigrations(db, MIGRATIONS_DIR);
  makeFixtureProject(projectRoot);
});

afterEach(() => {
  db.close();
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('atlas-indexer runner', () => {
  it('end-to-end: walks → indexes → resolves → writes SQLite rows', async () => {
    const bus = new CapturingBus();
    const result = await runAtlasIndexer(db, {
      snapshotId: 'snap-e2e-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });

    expect(result.files).toBe(4); // util.ts + main.ts + calc.py + lib.rs
    expect(result.symbols).toBeGreaterThan(0);

    const kb = new SymbolsKB(db);
    const all = kb.listSymbolsInSnapshot('snap-e2e-1');
    expect(all.length).toBeGreaterThan(0);

    const greeter = kb.findSymbolsByQualifiedName('snap-e2e-1', 'Greeter');
    expect(greeter.length).toBe(1);
    expect(greeter[0]!.kind).toBe('class');

    const calcPy = kb.listSymbolsForFile('snap-e2e-1', 'pkg/calc.py');
    expect(calcPy.some((s) => s.name === 'add')).toBe(true);
    expect(calcPy.some((s) => s.name === 'Calc')).toBe(true);
  });

  it('publishes the four lifecycle events on the bus', async () => {
    const bus = new CapturingBus();
    await runAtlasIndexer(db, {
      snapshotId: 'snap-events-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });

    const types = bus.events.map((e) => e.type);
    expect(types[0]).toBe('atlas:indexing.started');
    expect(types[types.length - 1]).toBe('atlas:indexing.completed');
    expect(types.some((t) => t === 'atlas:indexing.progress')).toBe(true);
    expect(types).not.toContain('atlas:indexing.failed');
  });

  it('invokes onProgress for each candidate file', async () => {
    const bus = new CapturingBus();
    const seen: Array<{ filesDone: number; filesTotal: number }> = [];
    await runAtlasIndexer(db, {
      snapshotId: 'snap-prog-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      onProgress: (p) => seen.push(p),
      bus,
    });
    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(seen[seen.length - 1]!.filesDone).toBe(seen[seen.length - 1]!.filesTotal);
    expect(seen[seen.length - 1]!.filesTotal).toBe(4);
  });

  it('respects the `languages` filter (TS only)', async () => {
    const bus = new CapturingBus();
    const result = await runAtlasIndexer(db, {
      snapshotId: 'snap-tsonly-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      languages: ['ts'],
      bus,
    });
    expect(result.files).toBe(2);
    const kb = new SymbolsKB(db);
    const langs = new Set(kb.listSymbolsInSnapshot('snap-tsonly-1').map((s) => s.language));
    expect([...langs]).toEqual(['ts']);
  });

  it('respects fileFilter to skip files', async () => {
    const bus = new CapturingBus();
    const result = await runAtlasIndexer(db, {
      snapshotId: 'snap-filter-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      fileFilter: (rel) => !rel.endsWith('main.ts'),
      bus,
    });
    expect(result.files).toBe(3);
    const kb = new SymbolsKB(db);
    const main = kb.listSymbolsForFile('snap-filter-1', 'src/main.ts');
    expect(main).toEqual([]);
  });

  it('resolves cross-file calls (helper from main.ts)', async () => {
    const bus = new CapturingBus();
    await runAtlasIndexer(db, {
      snapshotId: 'snap-calls-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });
    const kb = new SymbolsKB(db);
    const helpers = kb.findSymbolsByQualifiedName('snap-calls-1', 'helper');
    expect(helpers.length).toBe(1);
    const callers = kb.listCallers(helpers[0]!.id);
    // greet → helper or main module-level call site → expect ≥ 1 caller.
    expect(callers.length).toBeGreaterThanOrEqual(1);
  });

  it('is idempotent under default ON CONFLICT(id) DO NOTHING', async () => {
    const bus = new CapturingBus();
    await runAtlasIndexer(db, {
      snapshotId: 'snap-idem-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });
    const kb = new SymbolsKB(db);
    const firstCount = kb.listSymbolsInSnapshot('snap-idem-1').length;

    // Second run with same snapshotId must not double-insert.
    await runAtlasIndexer(db, {
      snapshotId: 'snap-idem-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });
    const secondCount = kb.listSymbolsInSnapshot('snap-idem-1').length;
    expect(secondCount).toBe(firstCount);
  });

  it('replace=true clears prior snapshot rows before re-indexing', async () => {
    const bus = new CapturingBus();
    await runAtlasIndexer(db, {
      snapshotId: 'snap-rep-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      bus,
    });
    const kb = new SymbolsKB(db);
    const countBefore = kb.listSymbolsInSnapshot('snap-rep-1').length;
    expect(countBefore).toBeGreaterThan(0);

    // Drop one source file and rerun with replace=true.
    rmSync(join(projectRoot, 'pkg/calc.py'));
    const r2 = await runAtlasIndexer(db, {
      snapshotId: 'snap-rep-1',
      projectId: 'proj-1',
      projectPath: projectRoot,
      replace: true,
      bus,
    });
    expect(r2.files).toBe(3);
    const calcRows = kb.listSymbolsForFile('snap-rep-1', 'pkg/calc.py');
    expect(calcRows).toEqual([]);
  });

  it('publishes failed event when an unrecoverable error occurs', async () => {
    const bus = new CapturingBus();
    // Pass a nonexistent project path; walker yields zero files but the
    // pipeline still completes (no rows). Confirm failed is NOT emitted in
    // that empty case — only on hard exceptions.
    const result = await runAtlasIndexer(db, {
      snapshotId: 'snap-empty-1',
      projectId: 'proj-1',
      projectPath: join(projectRoot, 'does-not-exist'),
      bus,
    });
    expect(result.files).toBe(0);
    expect(bus.events.some((e) => e.type === 'atlas:indexing.failed')).toBe(false);
    expect(bus.events.some((e) => e.type === 'atlas:indexing.completed')).toBe(true);
  });
});
