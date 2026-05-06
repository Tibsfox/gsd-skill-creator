/**
 * SymbolsKB — round-trip + prepared-statement reuse tests (v1.49.607 W1 Track B).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { applyMigrations } from '../migrations.js';
import { SymbolsKB } from '../symbols.js';
import type {
  SymbolId,
  SnapshotId,
  AtlasSymbol,
} from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

let tmpDir: string;
let db: Database.Database;
let kb: SymbolsKB;

const SNAP: SnapshotId = 'snap-symbols-1';

function makeSymbolRow(opts: {
  id: string;
  file_path: string;
  kind?: string;
  name: string;
  qualified_name: string;
  start_byte: number;
  end_byte?: number;
  start_line: number;
  end_line?: number;
  signature_hash?: string | null;
  modifiers?: string[];
  language?: string;
  parent_symbol_id?: string | null;
  snapshot_id?: string;
  project_id?: string;
}): void {
  db.prepare(
    `INSERT INTO symbols
       (id, snapshot_id, project_id, file_path, kind, name, qualified_name,
        start_byte, end_byte, start_line, end_line, signature_hash,
        modifiers_json, language, parent_symbol_id)
     VALUES
       (@id, @snapshot_id, @project_id, @file_path, @kind, @name, @qualified_name,
        @start_byte, @end_byte, @start_line, @end_line, @signature_hash,
        @modifiers_json, @language, @parent_symbol_id)`,
  ).run({
    id: opts.id,
    snapshot_id: opts.snapshot_id ?? SNAP,
    project_id: opts.project_id ?? 'proj-1',
    file_path: opts.file_path,
    kind: opts.kind ?? 'function',
    name: opts.name,
    qualified_name: opts.qualified_name,
    start_byte: opts.start_byte,
    end_byte: opts.end_byte ?? opts.start_byte + 10,
    start_line: opts.start_line,
    end_line: opts.end_line ?? opts.start_line + 1,
    signature_hash: opts.signature_hash ?? null,
    modifiers_json: JSON.stringify(opts.modifiers ?? []),
    language: opts.language ?? 'ts',
    parent_symbol_id: opts.parent_symbol_id ?? null,
  });
}

function insertCall(id: string, caller: string, callee: string, line: number): void {
  db.prepare(
    `INSERT INTO calls
       (id, snapshot_id, caller_symbol_id, callee_symbol_id,
        call_site_byte, call_site_line, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, SNAP, caller, callee, line * 10, line, 1.0);
}

function insertReference(id: string, name: string, resolved: string | null, line: number): void {
  db.prepare(
    `INSERT INTO symbol_references
       (id, snapshot_id, file_path, start_byte, end_byte, start_line, end_line,
        name, resolved_symbol_id, resolution_confidence, resolution_kind)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, SNAP, 'src/a.ts', line * 10, line * 10 + 5, line, line, name, resolved, resolved ? 1.0 : 0.0, 'call');
}

function insertTypeRel(
  id: string,
  from: string,
  to: string,
  kind: 'extends' | 'implements' | 'uses_type' | 'returns' | 'param',
): void {
  db.prepare(
    `INSERT INTO type_relations
       (id, snapshot_id, from_symbol_id, to_symbol_id, kind, confidence)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, SNAP, from, to, kind, 1.0);
}

describe('intelligence/kb — SymbolsKB', () => {
  beforeEach(() => {
    tmpDir = join(
      tmpdir(),
      `gsd-symbols-kb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    db = new Database(join(tmpDir, 'atlas.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    applyMigrations(db, MIGRATIONS_DIR);
    kb = new SymbolsKB(db);
  });

  afterEach(() => {
    db.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('listSymbolsForFile returns rows ordered by start_byte', () => {
    makeSymbolRow({ id: 's1', file_path: 'src/a.ts', name: 'foo', qualified_name: 'foo', start_byte: 100, start_line: 10 });
    makeSymbolRow({ id: 's2', file_path: 'src/a.ts', name: 'bar', qualified_name: 'bar', start_byte: 50, start_line: 5 });
    makeSymbolRow({ id: 's3', file_path: 'src/b.ts', name: 'baz', qualified_name: 'baz', start_byte: 0, start_line: 1 });

    const result = kb.listSymbolsForFile(SNAP, 'src/a.ts');
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('s2');
    expect(result[1].id).toBe('s1');
  });

  it('getSymbol returns the matching symbol or null', () => {
    makeSymbolRow({
      id: 's-alpha',
      file_path: 'src/x.ts',
      name: 'Alpha',
      qualified_name: 'Alpha',
      start_byte: 0,
      start_line: 1,
      modifiers: ['public', 'export'],
      kind: 'class',
    });
    const found = kb.getSymbol('s-alpha' as SymbolId);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Alpha');
    expect(found?.kind).toBe('class');
    expect(found?.modifiers).toEqual(['public', 'export']);

    expect(kb.getSymbol('does-not-exist' as SymbolId)).toBeNull();
  });

  it('findSymbolsByQualifiedName resolves multiple matches across files', () => {
    makeSymbolRow({ id: 's1', file_path: 'src/a.ts', name: 'init', qualified_name: 'pkg.init', start_byte: 10, start_line: 2 });
    makeSymbolRow({ id: 's2', file_path: 'src/b.ts', name: 'init', qualified_name: 'pkg.init', start_byte: 20, start_line: 3 });
    makeSymbolRow({ id: 's3', file_path: 'src/c.ts', name: 'init', qualified_name: 'other.init', start_byte: 30, start_line: 4 });

    const result = kb.findSymbolsByQualifiedName(SNAP, 'pkg.init');
    expect(result.length).toBe(2);
    expect(result.map((s: AtlasSymbol) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('listCallers returns inbound call edges', () => {
    makeSymbolRow({ id: 'callee', file_path: 'src/a.ts', name: 'target', qualified_name: 'target', start_byte: 0, start_line: 1 });
    makeSymbolRow({ id: 'caller-1', file_path: 'src/b.ts', name: 'cA', qualified_name: 'cA', start_byte: 0, start_line: 1 });
    makeSymbolRow({ id: 'caller-2', file_path: 'src/c.ts', name: 'cB', qualified_name: 'cB', start_byte: 0, start_line: 1 });
    insertCall('e1', 'caller-1', 'callee', 5);
    insertCall('e2', 'caller-2', 'callee', 7);
    insertCall('e3', 'caller-1', 'caller-2', 9); // should NOT appear

    const result = kb.listCallers('callee' as SymbolId);
    expect(result.length).toBe(2);
    expect(result.every((e) => e.callee_symbol_id === 'callee')).toBe(true);
  });

  it('listCallees returns outbound call edges', () => {
    makeSymbolRow({ id: 'caller', file_path: 'src/a.ts', name: 'main', qualified_name: 'main', start_byte: 0, start_line: 1 });
    makeSymbolRow({ id: 'cee-1', file_path: 'src/b.ts', name: 'foo', qualified_name: 'foo', start_byte: 0, start_line: 1 });
    makeSymbolRow({ id: 'cee-2', file_path: 'src/c.ts', name: 'bar', qualified_name: 'bar', start_byte: 0, start_line: 1 });
    insertCall('e1', 'caller', 'cee-1', 4);
    insertCall('e2', 'caller', 'cee-2', 8);

    const result = kb.listCallees('caller' as SymbolId);
    expect(result.length).toBe(2);
    expect(result.map((e) => e.callee_symbol_id).sort()).toEqual(['cee-1', 'cee-2']);
  });

  it('listReferencesForSymbol returns references with resolved_symbol_id matching', () => {
    makeSymbolRow({ id: 'sym-x', file_path: 'src/x.ts', name: 'X', qualified_name: 'X', start_byte: 0, start_line: 1 });
    insertReference('r1', 'X', 'sym-x', 10);
    insertReference('r2', 'X', 'sym-x', 20);
    insertReference('r3', 'Y', null, 30); // unresolved — should not appear

    const result = kb.listReferencesForSymbol('sym-x' as SymbolId);
    expect(result.length).toBe(2);
    expect(result[0].resolved_symbol_id).toBe('sym-x');
  });

  it('listTypeRelationsFrom and listTypeRelationsTo split by direction', () => {
    makeSymbolRow({ id: 'A', file_path: 'src/a.ts', name: 'A', qualified_name: 'A', start_byte: 0, start_line: 1, kind: 'class' });
    makeSymbolRow({ id: 'B', file_path: 'src/b.ts', name: 'B', qualified_name: 'B', start_byte: 0, start_line: 1, kind: 'class' });
    makeSymbolRow({ id: 'C', file_path: 'src/c.ts', name: 'C', qualified_name: 'C', start_byte: 0, start_line: 1, kind: 'interface' });
    insertTypeRel('t1', 'A', 'B', 'extends');
    insertTypeRel('t2', 'A', 'C', 'implements');
    insertTypeRel('t3', 'B', 'A', 'uses_type'); // back-edge

    const fromA = kb.listTypeRelationsFrom('A' as SymbolId);
    expect(fromA.length).toBe(2);
    expect(fromA.map((r) => r.kind).sort()).toEqual(['extends', 'implements']);

    const toA = kb.listTypeRelationsTo('A' as SymbolId);
    expect(toA.length).toBe(1);
    expect(toA[0].kind).toBe('uses_type');
  });

  it('prepared statements are reused across repeated calls', () => {
    makeSymbolRow({ id: 's1', file_path: 'src/a.ts', name: 'foo', qualified_name: 'foo', start_byte: 0, start_line: 1 });
    expect(kb.preparedStatementCount()).toBe(0);
    kb.listSymbolsForFile(SNAP, 'src/a.ts');
    expect(kb.preparedStatementCount()).toBe(1);
    kb.listSymbolsForFile(SNAP, 'src/a.ts');
    kb.listSymbolsForFile(SNAP, 'src/b.ts');
    expect(kb.preparedStatementCount()).toBe(1);

    kb.getSymbol('s1' as SymbolId);
    expect(kb.preparedStatementCount()).toBe(2);

    // A round-trip across all 9 cacheable methods must end at exactly 9 cached statements
    kb.findSymbolsByQualifiedName(SNAP, 'foo');
    kb.listCallers('s1' as SymbolId);
    kb.listCallees('s1' as SymbolId);
    kb.listReferencesForSymbol('s1' as SymbolId);
    kb.listTypeRelationsFrom('s1' as SymbolId);
    kb.listTypeRelationsTo('s1' as SymbolId);
    kb.listSymbolsInSnapshot(SNAP); // base case (no filters) — uses cached stmt
    expect(kb.preparedStatementCount()).toBe(9);
  });

  it('listSymbolsInSnapshot returns all symbols in snapshot ordered by file + start_byte', () => {
    makeSymbolRow({ id: 's1', file_path: 'src/a.ts', name: 'foo', qualified_name: 'foo', start_byte: 50, start_line: 5 });
    makeSymbolRow({ id: 's2', file_path: 'src/a.ts', name: 'bar', qualified_name: 'bar', start_byte: 10, start_line: 2 });
    makeSymbolRow({ id: 's3', file_path: 'src/b.ts', name: 'baz', qualified_name: 'baz', start_byte: 0, start_line: 1 });
    makeSymbolRow({ id: 's4', file_path: 'src/c.ts', name: 'qux', qualified_name: 'qux', start_byte: 0, start_line: 1, snapshot_id: 'other-snap' });

    const result = kb.listSymbolsInSnapshot(SNAP);
    expect(result.length).toBe(3);
    // ordered: src/a.ts (byte 10 → byte 50) then src/b.ts
    expect(result[0].id).toBe('s2');
    expect(result[1].id).toBe('s1');
    expect(result[2].id).toBe('s3');
  });

  it('listSymbolsInSnapshot filters by kindFilter', () => {
    makeSymbolRow({ id: 'fn1', file_path: 'src/a.ts', name: 'fn1', qualified_name: 'fn1', start_byte: 0, start_line: 1, kind: 'function' });
    makeSymbolRow({ id: 'cl1', file_path: 'src/a.ts', name: 'Cl1', qualified_name: 'Cl1', start_byte: 10, start_line: 2, kind: 'class' });
    makeSymbolRow({ id: 'if1', file_path: 'src/a.ts', name: 'If1', qualified_name: 'If1', start_byte: 20, start_line: 3, kind: 'interface' });

    const result = kb.listSymbolsInSnapshot(SNAP, { kindFilter: ['function', 'class'] });
    expect(result.length).toBe(2);
    expect(result.map((s) => s.kind).sort()).toEqual(['class', 'function']);
  });

  it('listSymbolsInSnapshot filters by languageFilter', () => {
    makeSymbolRow({ id: 'ts1', file_path: 'src/a.ts', name: 'a', qualified_name: 'a', start_byte: 0, start_line: 1, language: 'ts' });
    makeSymbolRow({ id: 'rs1', file_path: 'src/b.rs', name: 'b', qualified_name: 'b', start_byte: 0, start_line: 1, language: 'rust' });
    makeSymbolRow({ id: 'py1', file_path: 'src/c.py', name: 'c', qualified_name: 'c', start_byte: 0, start_line: 1, language: 'python' });

    const result = kb.listSymbolsInSnapshot(SNAP, { languageFilter: ['ts', 'rust'] });
    expect(result.length).toBe(2);
    expect(result.map((s) => s.language).sort()).toEqual(['rust', 'ts']);
  });

  it('listSymbolsInSnapshot respects limit and offset pagination', () => {
    for (let i = 0; i < 5; i++) {
      makeSymbolRow({ id: `pg${i}`, file_path: 'src/a.ts', name: `f${i}`, qualified_name: `f${i}`, start_byte: i * 10, start_line: i + 1 });
    }
    const page1 = kb.listSymbolsInSnapshot(SNAP, { limit: 2, offset: 0 });
    const page2 = kb.listSymbolsInSnapshot(SNAP, { limit: 2, offset: 2 });
    const page3 = kb.listSymbolsInSnapshot(SNAP, { limit: 2, offset: 4 });
    expect(page1.length).toBe(2);
    expect(page2.length).toBe(2);
    expect(page3.length).toBe(1);
    // No overlap
    const ids = [...page1, ...page2, ...page3].map((s) => s.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('joins across symbols + calls + symbol_references all see the same row', () => {
    // A method symbol with one caller and one separate textual reference
    makeSymbolRow({
      id: 'method-x',
      file_path: 'src/svc.ts',
      name: 'doWork',
      qualified_name: 'Service.doWork',
      kind: 'method',
      start_byte: 100,
      start_line: 12,
      modifiers: ['public', 'async'],
    });
    makeSymbolRow({
      id: 'caller-y',
      file_path: 'src/main.ts',
      name: 'run',
      qualified_name: 'run',
      start_byte: 0,
      start_line: 1,
    });
    insertCall('call-1', 'caller-y', 'method-x', 22);
    insertReference('ref-1', 'doWork', 'method-x', 22);

    const sym = kb.getSymbol('method-x' as SymbolId);
    expect(sym?.modifiers).toEqual(['public', 'async']);

    const callers = kb.listCallers('method-x' as SymbolId);
    expect(callers.length).toBe(1);
    expect(callers[0].caller_symbol_id).toBe('caller-y');

    const refs = kb.listReferencesForSymbol('method-x' as SymbolId);
    expect(refs.length).toBe(1);
    expect(refs[0].resolved_symbol_id).toBe('method-x');
    expect(refs[0].resolution_kind).toBe('call');
  });

  // ─── F2: bulk-insert writers (atlas-indexer) ────────────────────────

  it('bulkInsertSymbols round-trips through listSymbolsInSnapshot', () => {
    const inserted = kb.bulkInsertSymbols([
      {
        id: 'b1',
        snapshot_id: SNAP,
        project_id: 'proj-1',
        file_path: 'src/x.ts',
        kind: 'function',
        name: 'f',
        qualified_name: 'f',
        start_byte: 0,
        end_byte: 10,
        start_line: 1,
        end_line: 2,
        signature_hash: 'h1',
        modifiers: ['async'],
        language: 'ts',
        parent_symbol_id: null,
      },
      {
        id: 'b2',
        snapshot_id: SNAP,
        project_id: 'proj-1',
        file_path: 'src/y.ts',
        kind: 'class',
        name: 'C',
        qualified_name: 'C',
        start_byte: 0,
        end_byte: 20,
        start_line: 1,
        end_line: 5,
        signature_hash: null,
        modifiers: [],
        language: 'ts',
        parent_symbol_id: null,
      },
    ]);
    expect(inserted).toBe(2);
    const all = kb.listSymbolsInSnapshot(SNAP);
    expect(all.length).toBe(2);
    expect(all.find((s) => s.id === 'b1')?.modifiers).toEqual(['async']);
  });

  it('bulkInsertSymbols is idempotent on conflicting ids', () => {
    const row = {
      id: 'b1',
      snapshot_id: SNAP,
      project_id: 'proj-1',
      file_path: 'src/x.ts',
      kind: 'function' as const,
      name: 'f',
      qualified_name: 'f',
      start_byte: 0,
      end_byte: 10,
      start_line: 1,
      end_line: 2,
      signature_hash: null,
      modifiers: [],
      language: 'ts' as const,
      parent_symbol_id: null,
    };
    kb.bulkInsertSymbols([row]);
    const second = kb.bulkInsertSymbols([row]);
    expect(second).toBe(0);
    expect(kb.listSymbolsInSnapshot(SNAP).length).toBe(1);
  });

  it('bulkInsertCalls + bulkInsertReferences + bulkInsertTypeRelations round-trip', () => {
    kb.bulkInsertSymbols([
      {
        id: 'A',
        snapshot_id: SNAP,
        project_id: 'p',
        file_path: 'a.ts',
        kind: 'function',
        name: 'A',
        qualified_name: 'A',
        start_byte: 0,
        end_byte: 5,
        start_line: 1,
        end_line: 1,
        signature_hash: null,
        modifiers: [],
        language: 'ts',
        parent_symbol_id: null,
      },
      {
        id: 'B',
        snapshot_id: SNAP,
        project_id: 'p',
        file_path: 'b.ts',
        kind: 'function',
        name: 'B',
        qualified_name: 'B',
        start_byte: 0,
        end_byte: 5,
        start_line: 1,
        end_line: 1,
        signature_hash: null,
        modifiers: [],
        language: 'ts',
        parent_symbol_id: null,
      },
    ]);
    expect(
      kb.bulkInsertCalls([
        {
          id: 'C-1',
          snapshot_id: SNAP,
          caller_symbol_id: 'A',
          callee_symbol_id: 'B',
          call_site_byte: 4,
          call_site_line: 1,
          confidence: 0.9,
        },
      ]),
    ).toBe(1);
    expect(kb.listCallees('A' as SymbolId).length).toBe(1);

    expect(
      kb.bulkInsertReferences([
        {
          id: 'R-1',
          snapshot_id: SNAP,
          file_path: 'a.ts',
          start_byte: 4,
          end_byte: 5,
          start_line: 1,
          end_line: 1,
          name: 'B',
          resolved_symbol_id: 'B',
          resolution_confidence: 0.9,
          resolution_kind: 'call',
        },
      ]),
    ).toBe(1);
    expect(kb.listReferencesForSymbol('B' as SymbolId).length).toBe(1);

    expect(
      kb.bulkInsertTypeRelations([
        {
          id: 'T-1',
          snapshot_id: SNAP,
          from_symbol_id: 'A',
          to_symbol_id: 'B',
          kind: 'uses_type',
          confidence: 0.8,
        },
      ]),
    ).toBe(1);
    expect(kb.listTypeRelationsFrom('A' as SymbolId).length).toBe(1);
  });

  it('clearSnapshot removes all symbol-side rows for the snapshot', () => {
    kb.bulkInsertSymbols([
      {
        id: 's1',
        snapshot_id: SNAP,
        project_id: 'p',
        file_path: 'a.ts',
        kind: 'function',
        name: 'a',
        qualified_name: 'a',
        start_byte: 0,
        end_byte: 5,
        start_line: 1,
        end_line: 1,
        signature_hash: null,
        modifiers: [],
        language: 'ts',
        parent_symbol_id: null,
      },
    ]);
    expect(kb.listSymbolsInSnapshot(SNAP).length).toBe(1);
    kb.clearSnapshot(SNAP);
    expect(kb.listSymbolsInSnapshot(SNAP).length).toBe(0);
  });
});
