import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';

const here = dirname(fileURLToPath(import.meta.url));
const M001 = readFileSync(resolve(here, '..', 'db', 'migrations', '001_initial.sql'), 'utf-8');
const M002 = readFileSync(
  resolve(here, '..', 'db', 'migrations', '002_snapshot_diff_cache.sql'),
  'utf-8',
);
const M003 = readFileSync(
  resolve(here, '..', 'db', 'migrations', '003_atlas_symbols.sql'),
  'utf-8',
);

const ATLAS_TABLES = [
  'symbols',
  'symbol_references',
  'calls',
  'type_relations',
  'files_changed',
  'mission_provenance',
];

const ATLAS_INDEXES = [
  'idx_symbols_snapshot',
  'idx_symbols_file',
  'idx_symbols_qualified_name',
  'idx_symbols_kind',
  'idx_symbols_parent',
  'idx_refs_snapshot',
  'idx_refs_file',
  'idx_refs_resolved',
  'idx_refs_name',
  'idx_calls_snapshot',
  'idx_calls_caller',
  'idx_calls_callee',
  'idx_type_rel_snapshot',
  'idx_type_rel_from',
  'idx_type_rel_to',
  'idx_files_changed_mission',
  'idx_files_changed_path',
  'idx_files_changed_commit',
  'idx_provenance_snapshot',
  'idx_provenance_file_line',
  'idx_provenance_mission',
];

const V1_TABLES = [
  'projects',
  'snapshots',
  'findings',
  'briefings',
  'meetings',
  'meeting_log',
  'decisions',
  'bundles',
  'bundle_decisions',
  'mission_links',
  'schema_version',
];

describe('intelligence/db — migration 003_atlas_symbols (Code Atlas, v1.49.607)', () => {
  it('applies cleanly to a fresh in-memory DB on top of v1+v2', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    expect(() => db.exec(M003)).not.toThrow();

    const tables = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);

    for (const t of ATLAS_TABLES) expect(tables).toContain(t);

    db.close();
  });

  it('preserves all v1 tables (additive — no DROP/ALTER/RENAME)', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    const tables = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);

    for (const t of V1_TABLES) expect(tables).toContain(t);

    db.close();
  });

  it('creates all 21 atlas indexes', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    const indexes = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);

    for (const i of ATLAS_INDEXES) expect(indexes).toContain(i);

    db.close();
  });

  it('stamps schema_version to 3', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    const rows = db
      .prepare('SELECT version FROM schema_version ORDER BY version')
      .all() as Array<{ version: number }>;

    const versions = rows.map((r) => r.version);
    expect(versions).toContain(1);
    expect(versions).toContain(2);
    expect(versions).toContain(3);

    db.close();
  });

  it('is idempotent on re-apply (matches v1/v2 D-05 convention)', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);
    expect(() => db.exec(M003)).not.toThrow();

    const rows = db
      .prepare('SELECT version FROM schema_version WHERE version = 3')
      .all() as Array<{ version: number }>;
    expect(rows.length).toBe(1);

    db.close();
  });

  it('does not break v1 query suite (sample: list projects)', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    db.prepare(
      `INSERT INTO projects (id, name, path, kind, priority, last_activity_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run('p1', 'Test', '/tmp/p1', 'code', 'med', new Date().toISOString());

    const rows = db
      .prepare('SELECT id, name FROM projects ORDER BY last_activity_at DESC')
      .all() as Array<{ id: string; name: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('p1');

    db.close();
  });

  it('round-trips a symbol row', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    db.prepare(
      `INSERT INTO symbols (
        id, snapshot_id, project_id, file_path, kind, name, qualified_name,
        start_byte, end_byte, start_line, end_line, signature_hash,
        modifiers_json, language, parent_symbol_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      's1',
      'snap1',
      'p1',
      'src/foo.ts',
      'function',
      'foo',
      'foo',
      0,
      120,
      1,
      8,
      'fn:0:1',
      JSON.stringify(['export']),
      'ts',
      null,
    );

    const row = db.prepare('SELECT name, language, kind FROM symbols WHERE id = ?').get('s1') as
      | { name: string; language: string; kind: string }
      | undefined;
    expect(row).toBeDefined();
    expect(row?.name).toBe('foo');
    expect(row?.language).toBe('ts');
    expect(row?.kind).toBe('function');

    db.close();
  });

  it('round-trips a mission_provenance row (the GSD superpower table)', () => {
    const db = new Database(':memory:');
    db.exec(M001);
    db.exec(M002);
    db.exec(M003);

    db.prepare(
      `INSERT INTO mission_provenance (
        id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run('mp1', 'snap1', 'src/foo.ts', 42, 'v1.49.607', 'c73d59910', 0.85);

    const row = db
      .prepare('SELECT mission_id, weight FROM mission_provenance WHERE file_path = ? AND line_no = ?')
      .get('src/foo.ts', 42) as { mission_id: string; weight: number } | undefined;
    expect(row).toBeDefined();
    expect(row?.mission_id).toBe('v1.49.607');
    expect(row?.weight).toBeCloseTo(0.85);

    db.close();
  });
});
