import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = resolve(here, '..', 'db', 'migrations', '001_initial.sql');
const SQL = readFileSync(MIGRATION_PATH, 'utf-8');

const EXPECTED_TABLES = [
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

const EXPECTED_INDEXES = [
  'idx_projects_recent',
  'idx_findings_project_status',
  'idx_decisions_meeting',
];

describe('intelligence/db — migration 001_initial', () => {
  it('applies cleanly to a fresh in-memory DB (S7 safety-critical)', () => {
    const db = new Database(':memory:');
    expect(() => db.exec(SQL)).not.toThrow();

    const tables = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);

    for (const t of EXPECTED_TABLES) {
      expect(tables).toContain(t);
    }

    db.close();
  });

  it('creates the three hot-path indexes', () => {
    const db = new Database(':memory:');
    db.exec(SQL);

    const indexes = (
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        .all() as Array<{ name: string }>
    ).map((r) => r.name);

    for (const i of EXPECTED_INDEXES) {
      expect(indexes).toContain(i);
    }

    db.close();
  });

  it('inserts schema_version row at version 1', () => {
    const db = new Database(':memory:');
    db.exec(SQL);

    const rows = db
      .prepare('SELECT version, applied_at FROM schema_version')
      .all() as Array<{ version: number; applied_at: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].version).toBe(1);
    expect(rows[0].applied_at).toBeTruthy();

    db.close();
  });

  it('is idempotent on re-apply (D-05)', () => {
    const db = new Database(':memory:');
    db.exec(SQL);
    expect(() => db.exec(SQL)).not.toThrow();

    const rows = db
      .prepare('SELECT version FROM schema_version')
      .all() as Array<{ version: number }>;
    expect(rows.length).toBe(1);
    expect(rows[0].version).toBe(1);

    db.close();
  });

  it('enables foreign_keys pragma after apply', () => {
    const db = new Database(':memory:');
    db.exec(SQL);

    const result = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(result.foreign_keys).toBe(1);

    db.close();
  });
});
