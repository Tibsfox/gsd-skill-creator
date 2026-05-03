/**
 * C04 T1 — Migration runner tests (TDD RED phase).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyMigrations } from '../migrations.js';

const MIGRATION_001 = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (1, datetime('now'));
`.trim();

const MIGRATION_002 = `
CREATE TABLE IF NOT EXISTS test_table_v2 (
  id TEXT PRIMARY KEY
);
INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (2, datetime('now'));
`.trim();

const MIGRATION_MALFORMED = `
CREATE TABLE INVALID SYNTAX (((;
`.trim();

let tmpDir: string;

describe('intelligence/kb — applyMigrations', () => {
  beforeEach(() => {
    tmpDir = join(tmpdir(), `gsd-migration-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('fresh DB → applies 001 migration → schema_version=1', () => {
    writeFileSync(join(tmpDir, '001_initial.sql'), MIGRATION_001);
    const db = new Database(':memory:');
    applyMigrations(db, tmpDir);

    const rows = db.prepare('SELECT version FROM schema_version').all() as Array<{ version: number }>;
    expect(rows.length).toBe(1);
    expect(rows[0].version).toBe(1);

    db.close();
  });

  it('already at v1 → re-apply is a no-op (idempotent)', () => {
    writeFileSync(join(tmpDir, '001_initial.sql'), MIGRATION_001);
    const db = new Database(':memory:');
    applyMigrations(db, tmpDir);
    // Apply again — must not error, must not duplicate schema_version row
    applyMigrations(db, tmpDir);

    const rows = db.prepare('SELECT version FROM schema_version').all() as Array<{ version: number }>;
    expect(rows.length).toBe(1);
    expect(rows[0].version).toBe(1);

    db.close();
  });

  it('new v2 file present → applies after v1', () => {
    writeFileSync(join(tmpDir, '001_initial.sql'), MIGRATION_001);
    writeFileSync(join(tmpDir, '002_extra.sql'), MIGRATION_002);
    const db = new Database(':memory:');
    applyMigrations(db, tmpDir);

    const rows = db.prepare('SELECT version FROM schema_version ORDER BY version').all() as Array<{ version: number }>;
    expect(rows.length).toBe(2);
    expect(rows[0].version).toBe(1);
    expect(rows[1].version).toBe(2);

    // The new table must exist
    expect(() => db.prepare('SELECT id FROM test_table_v2 LIMIT 1').all()).not.toThrow();

    db.close();
  });

  it('malformed SQL file → throws with file name in error message', () => {
    writeFileSync(join(tmpDir, '001_bad.sql'), MIGRATION_MALFORMED);
    const db = new Database(':memory:');
    // Ensure schema_version table exists first so we get to the file
    db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    expect(() => applyMigrations(db, tmpDir)).toThrowError(/001_bad\.sql/);
    db.close();
  });

  it('empty migrations dir → no-op (no error)', () => {
    const db = new Database(':memory:');
    expect(() => applyMigrations(db, tmpDir)).not.toThrow();
    db.close();
  });
});
