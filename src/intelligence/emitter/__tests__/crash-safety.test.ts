/**
 * C10 / T12 — Crash safety.
 *
 * Process kill mid-emission must leave the staging dir in a consistent state:
 *   - No partial files at the manifest path (commit point not reached)
 *   - Orphan `.inbox-txn-*` directory left behind (D-25-19)
 *   - cleanupOrphanTransactions() removes it after its age threshold
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  utimesSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import { cleanupOrphanTransactions } from '../staging.js';
import {
  buildPopulatedKB,
  makeDecision,
} from './_fixtures.js';

let stagingRoot: string;

beforeEach(() => {
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-cs-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C10 / T12 — crash safety', () => {
  it('after kill mid-rename, no manifest is present', async () => {
    const f = buildPopulatedKB();
    const bundled = [
      makeDecision({ id: 'cs-d1', state: 'bundled', kind: 'research_mission', ai_draft: { title: 'A', body: 'a' } }),
      makeDecision({ id: 'cs-d2', state: 'bundled', kind: 'vision_mission', ai_draft: { title: 'B', body: 'b' } }),
    ];
    f.kb._state.decisions.delete(f.decision.id);
    for (const d of bundled) f.kb._state.decisions.set(d.id, d);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });

    // Inject a synthetic crash by monkey-patching the underlying staging.
    // The simplest path: trigger a crash via the `staging.ts` injectFailureAtRename
    // option — but emitBundle wraps it. So we directly use the staging module:
    const { emitBundle: fsEmitBundle } = await import('../staging.js');
    expect(() =>
      fsEmitBundle(
        [
          { request_id: 'cs-r1', vision_doc: '# A', meta_json: '{}' },
          { request_id: 'cs-r2', vision_doc: '# B', meta_json: '{}' },
        ],
        { bundle_id: 'M-cs01', yaml: 'bundle_id: M-cs01\n' },
        stagingRoot,
        { injectFailureAtRename: 1 },
      ),
    ).toThrow('synthetic rename failure');

    // Manifest must NOT be in staging/inbox/bundles
    const bundleDir = join(stagingRoot, 'staging', 'inbox', 'bundles');
    if (existsSync(bundleDir)) {
      const bundleFiles = readdirSync(bundleDir);
      expect(bundleFiles).not.toContain('M-cs01.bundle.yaml');
    }
  });

  it('orphan transaction directory is left behind for sweep', async () => {
    const { emitBundle: fsEmitBundle } = await import('../staging.js');
    expect(() =>
      fsEmitBundle(
        [
          { request_id: 'cs-r1', vision_doc: '# A', meta_json: '{}' },
        ],
        { bundle_id: 'M-cs02', yaml: 'bundle_id: M-cs02\n' },
        stagingRoot,
        { injectFailureAtRename: 0 },
      ),
    ).toThrow();

    const orphans = readdirSync(stagingRoot).filter((e) => e.startsWith('.inbox-txn-'));
    expect(orphans.length).toBe(1);
  });

  it('cleanupOrphanTransactions sweeps old orphans (D-25-19)', () => {
    // Create an orphan directly + backdate it
    const orphan = join(stagingRoot, '.inbox-txn-old99');
    mkdirSync(orphan);
    const past = (Date.now() - 90 * 60 * 1000) / 1000;
    utimesSync(orphan, past, past);

    const removed = cleanupOrphanTransactions(stagingRoot, 60 * 60 * 1000);
    expect(removed).toBe(1);
    expect(existsSync(orphan)).toBe(false);
  });

  it('cleanupOrphanTransactions leaves recent orphans alone', () => {
    const fresh = join(stagingRoot, '.inbox-txn-fresh99');
    mkdirSync(fresh);
    const removed = cleanupOrphanTransactions(stagingRoot, 60 * 60 * 1000);
    expect(removed).toBe(0);
    expect(existsSync(fresh)).toBe(true);
  });

  it('emitter.cleanupOrphanTransactions() is idempotent', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    expect(emitter.cleanupOrphanTransactions(60 * 60 * 1000)).toBe(0);
    expect(emitter.cleanupOrphanTransactions(60 * 60 * 1000)).toBe(0);
  });
});
