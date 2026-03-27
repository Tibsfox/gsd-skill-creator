/**
 * Trust Lifecycle Integration Test — end-to-end against live Dolt.
 *
 * Runs the full trust lifecycle:
 *   register → create relationship → set trust vector → create contract →
 *   heartbeat renew → escalate trust level → issue stamp → archive
 *
 * Uses a temporary Dolt database created per test run.
 * Skips gracefully if dolt CLI is not available.
 *
 * @module trust-lifecycle-integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const exec = promisify(execFile);

// ============================================================================
// Dolt availability check
// ============================================================================

let testDir = '';

// Synchronous check — execSync to determine skip before tests register
let doltAvailable = false;
try {
  const { execSync } = require('node:child_process');
  execSync('dolt version', { stdio: 'ignore' });
  doltAvailable = true;
} catch {
  doltAvailable = false;
}

async function doltSQL(sql: string): Promise<Record<string, unknown>[]> {
  const { stdout } = await exec('dolt', ['sql', '-q', sql, '-r', 'json'], { cwd: testDir });
  try {
    const parsed = JSON.parse(stdout);
    return parsed.rows ?? parsed ?? [];
  } catch {
    return [];
  }
}

async function doltExec(sql: string): Promise<void> {
  await exec('dolt', ['sql', '-q', sql], { cwd: testDir });
}

beforeAll(async () => {
  if (!doltAvailable) return;

  // Create temp Dolt database
  testDir = await mkdtemp(join(tmpdir(), 'trust-lifecycle-'));
  await exec('dolt', ['init'], { cwd: testDir });

  // Create schema using our DDL definitions
  await doltExec(`
    CREATE TABLE IF NOT EXISTS _meta (\`key\` VARCHAR(64) PRIMARY KEY, value TEXT);
    INSERT INTO _meta (\`key\`, value) VALUES ('schema_version', '1.1');
  `);

  await doltExec(`
    CREATE TABLE IF NOT EXISTS rigs (
      handle VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(255),
      type ENUM('human','agent','org') NOT NULL,
      trust_level INT NOT NULL DEFAULT 0,
      joined_at TIMESTAMP NOT NULL,
      trust_level_changed_at TIMESTAMP
    );
  `);

  await doltExec(`
    CREATE TABLE IF NOT EXISTS stamps (
      id VARCHAR(64) PRIMARY KEY,
      author VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      valence JSON NOT NULL,
      confidence FLOAT DEFAULT 1,
      severity VARCHAR(16) DEFAULT 'leaf',
      context_id VARCHAR(64),
      context_type VARCHAR(32),
      message TEXT,
      created_at TIMESTAMP
    );
  `);

  await doltExec(`
    CREATE TABLE IF NOT EXISTS completions (
      id VARCHAR(64) PRIMARY KEY,
      wanted_id VARCHAR(64),
      completed_by VARCHAR(255),
      evidence TEXT,
      validated_by VARCHAR(255),
      stamp_id VARCHAR(64),
      completed_at TIMESTAMP,
      validated_at TIMESTAMP
    );
  `);

  await doltExec(`
    CREATE TABLE IF NOT EXISTS trust_relationships (
      id VARCHAR(48) PRIMARY KEY,
      rig_a VARCHAR(255) NOT NULL,
      rig_b VARCHAR(255) NOT NULL,
      magnitude_a FLOAT NOT NULL DEFAULT 0,
      angle_a FLOAT NOT NULL DEFAULT 0,
      magnitude_b FLOAT NOT NULL DEFAULT 0,
      angle_b FLOAT NOT NULL DEFAULT 0,
      bond_type VARCHAR(32) NOT NULL DEFAULT 'acquaintance',
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP
    );
  `);

  await doltExec(`
    CREATE TABLE IF NOT EXISTS trust_contracts (
      id VARCHAR(48) PRIMARY KEY,
      relationship_id VARCHAR(48) NOT NULL,
      contract_type VARCHAR(32) NOT NULL,
      initiated_by VARCHAR(255) NOT NULL,
      starts_at TIMESTAMP NOT NULL,
      expires_at TIMESTAMP,
      auto_renew BOOLEAN DEFAULT FALSE,
      renewal_count INT DEFAULT 0,
      status VARCHAR(16) NOT NULL DEFAULT 'active'
    );
  `);
});

afterAll(async () => {
  if (testDir) {
    await rm(testDir, { recursive: true, force: true });
  }
});

// ============================================================================
// Lifecycle Test
// ============================================================================

describe('Trust Lifecycle Integration', () => {
  it.skipIf(!doltAvailable)('schema version is set', async () => {
    const rows = await doltSQL("SELECT value FROM _meta WHERE `key` = 'schema_version'");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].value).toBe('1.1');
  });

  it.skipIf(!doltAvailable)('step 1: register two rigs', async () => {
    await doltExec(`
      INSERT INTO rigs (handle, display_name, type, trust_level, joined_at)
      VALUES ('fox-001', 'Test Fox', 'human', 0, NOW());
    `);
    await doltExec(`
      INSERT INTO rigs (handle, display_name, type, trust_level, joined_at)
      VALUES ('cedar-001', 'Test Cedar', 'agent', 0, NOW());
    `);

    const rigs = await doltSQL("SELECT handle FROM rigs ORDER BY handle");
    expect(rigs).toHaveLength(2);
    expect(rigs[0].handle).toBe('cedar-001');
    expect(rigs[1].handle).toBe('fox-001');
  });

  it.skipIf(!doltAvailable)('step 2: create trust relationship', async () => {
    await doltExec(`
      INSERT INTO trust_relationships (id, rig_a, rig_b, magnitude_a, angle_a, magnitude_b, angle_b, bond_type, created_at)
      VALUES ('tr-test-001', 'fox-001', 'cedar-001', 0.7, 0.5, 0.6, 0.3, 'colleague', NOW());
    `);

    const rels = await doltSQL("SELECT id, rig_a, rig_b, bond_type FROM trust_relationships");
    expect(rels).toHaveLength(1);
    expect(rels[0].rig_a).toBe('fox-001');
    expect(rels[0].bond_type).toBe('colleague');
  });

  it.skipIf(!doltAvailable)('step 3: create trust contract with auto-renew', async () => {
    await doltExec(`
      INSERT INTO trust_contracts (id, relationship_id, contract_type, initiated_by, starts_at, expires_at, auto_renew, status)
      VALUES ('tc-test-001', 'tr-test-001', 'collaboration', 'fox-001', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE, 'active');
    `);

    const contracts = await doltSQL("SELECT id, auto_renew, status FROM trust_contracts");
    expect(contracts).toHaveLength(1);
    expect(contracts[0].status).toBe('active');
  });

  it.skipIf(!doltAvailable)('step 4: heartbeat renew (increment renewal count)', async () => {
    await doltExec(`
      UPDATE trust_contracts SET renewal_count = renewal_count + 1, expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = 'tc-test-001';
    `);

    const contracts = await doltSQL("SELECT renewal_count FROM trust_contracts WHERE id = 'tc-test-001'");
    expect(Number(contracts[0].renewal_count)).toBe(1);
  });

  it.skipIf(!doltAvailable)('step 5: escalate trust level', async () => {
    await doltExec(`
      UPDATE rigs SET trust_level = 1, trust_level_changed_at = NOW() WHERE handle = 'fox-001';
    `);

    const rigs = await doltSQL("SELECT trust_level FROM rigs WHERE handle = 'fox-001'");
    expect(Number(rigs[0].trust_level)).toBe(1);
  });

  it.skipIf(!doltAvailable)('step 6: submit completion', async () => {
    await doltExec(`
      INSERT INTO completions (id, wanted_id, completed_by, evidence, completed_at)
      VALUES ('c-test-001', 'w-test-001', 'fox-001', 'Built the thing. 10 tests passing.', NOW());
    `);

    const comps = await doltSQL("SELECT id, completed_by FROM completions");
    expect(comps).toHaveLength(1);
  });

  it.skipIf(!doltAvailable)('step 7: issue stamp (cross-validation)', async () => {
    await doltExec(`
      INSERT INTO stamps (id, author, subject, valence, context_id, context_type, created_at)
      VALUES ('s-test-001', 'cedar-001', 'fox-001', '{"quality":4,"reliability":4,"creativity":3}', 'c-test-001', 'completion', NOW());
    `);
    await doltExec(`
      UPDATE completions SET validated_by = 'cedar-001', stamp_id = 's-test-001', validated_at = NOW() WHERE id = 'c-test-001';
    `);

    const stamps = await doltSQL("SELECT id, author, subject FROM stamps");
    expect(stamps).toHaveLength(1);
    expect(stamps[0].author).toBe('cedar-001');

    const comp = await doltSQL("SELECT validated_by FROM completions WHERE id = 'c-test-001'");
    expect(comp[0].validated_by).toBe('cedar-001');
  });

  it.skipIf(!doltAvailable)('step 8: archive relationship (soft delete)', async () => {
    await doltExec(`
      UPDATE trust_contracts SET status = 'archived' WHERE id = 'tc-test-001';
    `);

    const contracts = await doltSQL("SELECT status FROM trust_contracts WHERE id = 'tc-test-001'");
    expect(contracts[0].status).toBe('archived');
  });

  it.skipIf(!doltAvailable)('step 9: verify full state — 2 rigs, 1 relationship, 1 stamp, 1 validated completion', async () => {
    const rigs = await doltSQL("SELECT COUNT(*) as cnt FROM rigs");
    const rels = await doltSQL("SELECT COUNT(*) as cnt FROM trust_relationships");
    const stamps = await doltSQL("SELECT COUNT(*) as cnt FROM stamps");
    const validated = await doltSQL("SELECT COUNT(*) as cnt FROM completions WHERE validated_by IS NOT NULL");

    expect(Number(rigs[0].cnt)).toBe(2);
    expect(Number(rels[0].cnt)).toBe(1);
    expect(Number(stamps[0].cnt)).toBe(1);
    expect(Number(validated[0].cnt)).toBe(1);
  });

  it.skipIf(!doltAvailable)('step 10: schema version survives full lifecycle', async () => {
    const rows = await doltSQL("SELECT value FROM _meta WHERE `key` = 'schema_version'");
    expect(rows[0].value).toBe('1.1');
  });
});
