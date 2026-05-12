/**
 * C04 T5 — Findings round-trip tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KBStore } from '../store.js';
import { parseFindingIdArray, parseSuggestedMoves } from '../queries.js';
import type { Finding, FindingId } from '../../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, '../../db/migrations');

const PROJECT_ID = 'findings-test-project';
let tmpDir: string;
let store: KBStore;
let snapshotId: string;

async function setup() {
  store = new KBStore({
    registryPath: join(tmpDir, 'registry.db'),
    migrationsDir: MIGRATIONS_DIR,
  });
  await store.ensureRegistry();
  await store.registerProject({
    id: PROJECT_ID,
    name: 'Findings Test',
    path: join(tmpDir, 'findings-project'),
    kind: 'code',
    priority: 'med',
    last_activity_at: new Date().toISOString(),
  });
  await store.ensureProjectDB(PROJECT_ID);
  const snap = await store.writeSnapshot({
    project_id: PROJECT_ID,
    taken_at: new Date().toISOString(),
    files_scanned: 1,
    loc_total: 100,
  });
  snapshotId = snap.id;
}

function makeFinding(i: number, override: Partial<Finding> = {}): Finding {
  return {
    id: `F-test-${String(i).padStart(4, '0')}` as FindingId,
    project_id: PROJECT_ID,
    kind: 'dead_code',
    severity: 'low',
    confidence: 0.7,
    title: `Finding ${i}`,
    rationale: `Rationale for finding ${i}`,
    source_path: `src/module${i % 10}.ts`,
    produced_by: 'analyzer',
    produced_at: new Date().toISOString(),
    snapshot_id: snapshotId,
    status: 'open',
    ...override,
  };
}

describe('intelligence/kb — findings round-trip', () => {
  beforeEach(async () => {
    tmpDir = join(
      tmpdir(),
      `gsd-findings-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    await setup();
  }, 30000); // Pre-emptive at v1.49.638 W1C C5: widen hookTimeout to absorb full-suite I/O contention on KBStore registry + migrations setup (mirrors snapshot-lifecycle fix at 8cac9eff7).

  afterEach(() => {
    store.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('write 100 findings → listOpenFindings returns same 100 with JSON columns parsed', async () => {
    const findings = Array.from({ length: 100 }, (_, i) => makeFinding(i));
    await store.writeFindings(snapshotId, PROJECT_ID, findings);

    const result = await store.listOpenFindings(PROJECT_ID);
    expect(result.length).toBe(100);

    // Spot-check one finding
    const f = result.find((r) => r.id === 'F-test-0000');
    expect(f).toBeDefined();
    expect(f?.title).toBe('Finding 0');
    expect(f?.source_path).toBe('src/module0.ts');
    expect(f?.confidence).toBe(0.7);
  });

  it('update one finding (re-write) → list reflects update', async () => {
    await store.writeFindings(snapshotId, PROJECT_ID, [makeFinding(0)]);
    const updated = { ...makeFinding(0), severity: 'high' as const };
    await store.writeFindings(snapshotId, PROJECT_ID, [updated]);

    const result = await store.listOpenFindings(PROJECT_ID);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe('high');
  });

  it('findings with source_range round-trip correctly', async () => {
    const f = makeFinding(1, {
      source_range: { start: 42, end: 99 },
    });
    await store.writeFindings(snapshotId, PROJECT_ID, [f]);

    const result = await store.listOpenFindings(PROJECT_ID);
    expect(result[0].source_range).toEqual({ start: 42, end: 99 });
  });

  it('parseFindingIdArray throws on malformed JSON', () => {
    expect(() => parseFindingIdArray('{not-json}', 'test')).toThrow(/malformed JSON/);
  });

  it('parseFindingIdArray throws when not an array', () => {
    expect(() => parseFindingIdArray('"string"', 'test')).toThrow(/expected array/);
  });

  it('parseSuggestedMoves throws on malformed JSON', () => {
    expect(() => parseSuggestedMoves('invalid json', 'test')).toThrow(/malformed JSON/);
  });

  it('listOpenFindings returns <50ms for 1000-finding project (P5)', async () => {
    const findings = Array.from({ length: 1000 }, (_, i) => makeFinding(i));
    // Write in batches to avoid sqlite limits
    for (let i = 0; i < 10; i++) {
      await store.writeFindings(snapshotId, PROJECT_ID, findings.slice(i * 100, (i + 1) * 100));
    }

    // Warmup: one discard call to compile the SQLite query plan and tier up
    // the V8 call-site before the timed window (50ms sharp threshold).
    await store.listOpenFindings(PROJECT_ID);

    const start = performance.now();
    const result = await store.listOpenFindings(PROJECT_ID);
    const elapsed = performance.now() - start;

    expect(result.length).toBe(1000);
    expect(elapsed).toBeLessThan(50);
  });
});
