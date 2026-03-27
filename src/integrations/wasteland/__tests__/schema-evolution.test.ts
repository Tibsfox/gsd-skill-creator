/**
 * Tests for Schema Evolution — version-aware DDL migration.
 *
 * Covers:
 * - getSchemaVersion / setSchemaVersion
 * - diffSchema: detects new tables and new columns
 * - generateMigrationSQL: produces correct ALTER/CREATE statements
 * - migrate: full pipeline with mock query function
 * - SCHEMA_REGISTRY: version definitions are valid
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getSchemaVersion,
  setSchemaVersion,
  diffSchema,
  generateMigrationSQL,
  migrate,
  findSchema,
  SCHEMA_1_0,
  SCHEMA_1_1,
  SCHEMA_REGISTRY,
} from '../schema-evolution.js';
import type { SchemaVersion, QueryFn } from '../schema-evolution.js';

// ============================================================================
// Helpers
// ============================================================================

function mockQuery(responses: Record<string, unknown>[] = []): QueryFn {
  return vi.fn().mockResolvedValue({ rows: responses });
}

// ============================================================================
// Schema Registry
// ============================================================================

describe('SCHEMA_REGISTRY', () => {
  it('contains 1.0 and 1.1', () => {
    expect(SCHEMA_REGISTRY).toHaveLength(2);
    expect(SCHEMA_REGISTRY[0].version).toBe('1.0');
    expect(SCHEMA_REGISTRY[1].version).toBe('1.1');
  });

  it('1.0 has 7 tables', () => {
    expect(SCHEMA_1_0.tables).toHaveLength(7);
    const names = SCHEMA_1_0.tables.map(t => t.name).sort();
    expect(names).toEqual([
      '_meta', 'badges', 'chain_meta', 'completions', 'rigs', 'stamps', 'wanted',
    ]);
  });

  it('1.1 has same 7 tables with added columns', () => {
    expect(SCHEMA_1_1.tables).toHaveLength(7);
  });

  it('1.1 rigs has trust_level_changed_at column', () => {
    const rigs = SCHEMA_1_1.tables.find(t => t.name === 'rigs')!;
    const col = rigs.columns.find(c => c.name === 'trust_level_changed_at');
    expect(col).toBeDefined();
    expect(col!.type).toBe('TIMESTAMP');
  });

  it('1.1 wanted has sandbox_required column', () => {
    const wanted = SCHEMA_1_1.tables.find(t => t.name === 'wanted')!;
    const col = wanted.columns.find(c => c.name === 'sandbox_required');
    expect(col).toBeDefined();
  });

  it('1.1 completions has block_hash column', () => {
    const completions = SCHEMA_1_1.tables.find(t => t.name === 'completions')!;
    const col = completions.columns.find(c => c.name === 'block_hash');
    expect(col).toBeDefined();
  });
});

// ============================================================================
// findSchema
// ============================================================================

describe('findSchema', () => {
  it('finds 1.0', () => {
    expect(findSchema('1.0')?.version).toBe('1.0');
  });

  it('finds 1.1', () => {
    expect(findSchema('1.1')?.version).toBe('1.1');
  });

  it('returns null for unknown version', () => {
    expect(findSchema('9.9')).toBeNull();
  });
});

// ============================================================================
// getSchemaVersion
// ============================================================================

describe('getSchemaVersion', () => {
  it('reads version from _meta', async () => {
    const query = mockQuery([{ value: '1.0' }]);
    expect(await getSchemaVersion(query)).toBe('1.0');
  });

  it('returns 0.0 when no row exists', async () => {
    const query = mockQuery([]);
    expect(await getSchemaVersion(query)).toBe('0.0');
  });

  it('returns 0.0 when query fails', async () => {
    const query = vi.fn().mockRejectedValue(new Error('no such table'));
    expect(await getSchemaVersion(query)).toBe('0.0');
  });
});

// ============================================================================
// setSchemaVersion
// ============================================================================

describe('setSchemaVersion', () => {
  it('executes REPLACE INTO _meta', async () => {
    const query = mockQuery();
    await setSchemaVersion(query, '1.1');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("REPLACE INTO _meta"),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("'1.1'"),
    );
  });
});

// ============================================================================
// diffSchema
// ============================================================================

describe('diffSchema', () => {
  it('detects new columns added in 1.1', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    expect(diff.fromVersion).toBe('1.0');
    expect(diff.toVersion).toBe('1.1');

    const addOps = diff.operations.filter(op => op.type === 'add_column');
    // rigs: trust_level_changed_at, email (2)
    // wanted: project, type, priority, evidence_url, sandbox_required, sandbox_scope, sandbox_min_tier (7)
    // completions: parent_completion_id, block_hash, hop_uri (3)
    expect(addOps).toHaveLength(12);
  });

  it('includes set_version operation', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    const versionOps = diff.operations.filter(op => op.type === 'set_version');
    expect(versionOps).toHaveLength(1);
  });

  it('detects no changes when comparing same version', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_0);
    // Only set_version (no structural changes)
    const structuralOps = diff.operations.filter(op => op.type !== 'set_version');
    expect(structuralOps).toHaveLength(0);
  });

  it('detects new tables', () => {
    const extended: SchemaVersion = {
      version: '2.0',
      tables: [
        ...SCHEMA_1_1.tables,
        {
          name: 'new_table',
          columns: [
            { name: 'id', type: 'VARCHAR(64)', nullable: false },
          ],
          primaryKey: ['id'],
        },
      ],
    };
    const diff = diffSchema(SCHEMA_1_1, extended);
    const createOps = diff.operations.filter(op => op.type === 'create_table');
    expect(createOps).toHaveLength(1);
  });
});

// ============================================================================
// generateMigrationSQL
// ============================================================================

describe('generateMigrationSQL', () => {
  it('generates ALTER TABLE for new columns', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    const statements = generateMigrationSQL(diff);

    const alters = statements.filter(s => s.startsWith('ALTER TABLE'));
    expect(alters.length).toBe(12);

    // Check specific column additions
    expect(alters.some(s => s.includes('trust_level_changed_at'))).toBe(true);
    expect(alters.some(s => s.includes('sandbox_required'))).toBe(true);
    expect(alters.some(s => s.includes('block_hash'))).toBe(true);
  });

  it('generates CREATE TABLE for new tables', () => {
    const extended: SchemaVersion = {
      version: '2.0',
      tables: [
        ...SCHEMA_1_0.tables,
        {
          name: 'audit_log',
          columns: [
            { name: 'id', type: 'VARCHAR(64)', nullable: false },
            { name: 'event', type: 'TEXT', nullable: true },
          ],
          primaryKey: ['id'],
        },
      ],
    };
    const diff = diffSchema(SCHEMA_1_0, extended);
    const statements = generateMigrationSQL(diff);

    const creates = statements.filter(s => s.startsWith('CREATE TABLE'));
    expect(creates).toHaveLength(1);
    expect(creates[0]).toContain('audit_log');
    expect(creates[0]).toContain('PRIMARY KEY');
  });

  it('generates REPLACE INTO for version update', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    const statements = generateMigrationSQL(diff);
    const versionStmts = statements.filter(s => s.includes('schema_version'));
    expect(versionStmts).toHaveLength(1);
    expect(versionStmts[0]).toContain("'1.1'");
  });

  it('handles NOT NULL columns', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    const statements = generateMigrationSQL(diff);
    // All new columns in 1.1 are nullable, so no NOT NULL in ALTER
    const alters = statements.filter(s => s.startsWith('ALTER TABLE'));
    expect(alters.every(s => !s.includes('NOT NULL'))).toBe(true);
  });

  it('handles DEFAULT values', () => {
    const diff = diffSchema(SCHEMA_1_0, SCHEMA_1_1);
    const statements = generateMigrationSQL(diff);
    const sandboxStmt = statements.find(s => s.includes('sandbox_required'));
    expect(sandboxStmt).toContain('DEFAULT 0');
  });
});

// ============================================================================
// migrate
// ============================================================================

describe('migrate', () => {
  it('skips migration when already at target version', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ value: '1.1' }] });
    const result = await migrate(query, '1.1');

    expect(result.success).toBe(true);
    expect(result.operationsApplied).toBe(0);
    expect(result.fromVersion).toBe('1.1');
    expect(result.toVersion).toBe('1.1');
  });

  it('migrates from 1.0 to 1.1', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ value: '1.0' }] }) // getSchemaVersion
      .mockResolvedValue({ rows: [] }); // all ALTER/REPLACE statements

    const result = await migrate(query, '1.1');

    expect(result.success).toBe(true);
    expect(result.fromVersion).toBe('1.0');
    expect(result.toVersion).toBe('1.1');
    expect(result.operationsApplied).toBe(13); // 12 columns + 1 version
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for unknown current version', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ value: '0.5' }] });
    const result = await migrate(query, '1.1');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Unknown current schema version');
  });

  it('returns error for unknown target version', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ value: '1.0' }] });
    const result = await migrate(query, '9.9');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Unknown target schema version');
  });

  it('reports partial failure when some statements fail', async () => {
    let callCount = 0;
    const query = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { rows: [{ value: '1.0' }] }; // version read
      if (callCount === 5) throw new Error('column already exists'); // one failure
      return { rows: [] };
    });

    const result = await migrate(query, '1.1');

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.operationsApplied).toBe(12); // 13 total - 1 failed
  });
});
