/**
 * C10 / T7 — emitSendNow end-to-end.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import { buildPopulatedKB } from './_fixtures.js';

let stagingRoot: string;

beforeEach(() => {
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-sn-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C10 / T7 — emitSendNow', () => {
  it('writes both .md and .meta.json with bundle_id null and triggers KB updates', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(f.decision.id);

    expect(result.bundle_id).toBeNull();
    expect(existsSync(result.vision_doc_path)).toBe(true);
    expect(existsSync(result.meta_path)).toBe(true);

    const meta = JSON.parse(readFileSync(result.meta_path, 'utf8'));
    expect(meta.bundle_id).toBeNull();
    expect(meta.request_id).toBe(result.request_id);
    expect(meta.skill).toBe('research-mission-generator');

    expect(f.kb._state.markEmittedCalls.length).toBe(1);
    expect(f.kb._state.markEmittedCalls[0].decisionId).toBe(f.decision.id);
    expect(f.kb._state.missionLinkCalls.length).toBe(1);
    expect(f.kb._state.missionLinkCalls[0].kind).toBe('vision_seed');
  });

  it('no bundle manifest written for send-now', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await emitter.emitSendNow(f.decision.id);

    const bundleDir = join(stagingRoot, 'staging', 'inbox', 'bundles');
    if (existsSync(bundleDir)) {
      const bundles = readdirSync(bundleDir);
      expect(bundles.length).toBe(0);
    }
  });

  it('latency: 50 emit calls average <100 ms each (P3)', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });

    // Reset emission state by adding decisions.
    const baselineDecision = f.decision;
    const N = 50;
    for (let i = 0; i < N; i++) {
      const id = `bench-${i}`;
      const d = { ...baselineDecision, id };
      f.kb._state.decisions.set(id, d as typeof baselineDecision);
    }

    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      await emitter.emitSendNow(`bench-${i}`);
    }
    const t1 = performance.now();
    const avgMs = (t1 - t0) / N;
    // Generous bound; PRD says <100ms; in CI we allow up to 100ms avg.
    expect(avgMs).toBeLessThan(100);
  });

  it('rejects when decision missing source_findings field', async () => {
    const f = buildPopulatedKB();
    const broken = {
      ...f.decision,
      source_findings: undefined as unknown as typeof f.decision.source_findings,
    };
    f.kb._state.decisions.set('broken-id', broken);
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await expect(emitter.emitSendNow('broken-id')).rejects.toThrow(
      /missing source_findings/,
    );
  });

  it('vision-doc and meta land in staging/inbox/ (not in bundles/)', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitSendNow(f.decision.id);
    expect(result.vision_doc_path).toContain('/staging/inbox/');
    expect(result.vision_doc_path).not.toContain('/bundles/');
  });
});
