/**
 * C10 / T8 — emitBundle end-to-end.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { MissionEmitter } from '../compose.js';
import {
  buildPopulatedKB,
  makeDecision,
  makeFinding,
  type MockEmitterKBState,
} from './_fixtures.js';
import type { BundleId, MeetingId } from '../../types.js';

let stagingRoot: string;

beforeEach(() => {
  stagingRoot = mkdtempSync(join(tmpdir(), 'c10-be-'));
});

afterEach(() => {
  try {
    rmSync(stagingRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

function setupBundleScenario() {
  const f = buildPopulatedKB();

  // Add 3 bundled decisions to the meeting
  const bundled = [
    makeDecision({
      id: 'd1',
      state: 'bundled',
      kind: 'research_mission',
      source_findings: [f.finding.id],
      ai_draft: { title: 'Investigate spike', body: 'b1' },
    }),
    makeDecision({
      id: 'd2',
      state: 'bundled',
      kind: 'vision_mission',
      source_findings: [f.finding.id],
      ai_draft: { title: 'Pick up orphan', body: 'b2' },
    }),
    makeDecision({
      id: 'd3',
      state: 'bundled',
      kind: 'analysis_run',
      source_findings: [],
      ai_draft: { title: 'Snapshot diff', body: 'b3' },
    }),
  ];
  // And 1 sent_now decision
  const sentNow = makeDecision({
    id: 'd4',
    state: 'sent_now',
    kind: 'vision_mission',
    source_findings: [f.finding.id],
    emitted_at: '2026-05-03T10:00:00Z',
    emission_path: '/repo/.planning/staging/inbox/req_2026-05-03_1000_old1.md',
    ai_draft: { title: 'Already sent', body: 'b4' },
  });

  // Remove the original 'pending' decision; add bundled + sentNow
  f.kb._state.decisions.delete(f.decision.id);
  for (const d of bundled) f.kb._state.decisions.set(d.id, d);
  f.kb._state.decisions.set(sentNow.id, sentNow);

  return { f, bundled, sentNow };
}

describe('C10 / T8 — emitBundle', () => {
  it('3 bundled decisions → 3 .md + 3 .meta.json + 1 manifest', async () => {
    const { f } = setupBundleScenario();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitBundle(f.meeting.id);

    expect(result.emissions.length).toBe(3);
    expect(result.bundle_id).toBe(f.meeting.id);
    expect(existsSync(result.manifest_path)).toBe(true);

    for (const e of result.emissions) {
      expect(existsSync(e.vision_doc_path)).toBe(true);
      expect(existsSync(e.meta_path)).toBe(true);
      expect(e.bundle_id).toBe(f.meeting.id);
    }

    // Manifest contents
    const manifestText = readFileSync(result.manifest_path, 'utf8');
    const manifest = yaml.load(manifestText) as Record<string, unknown>;
    expect(manifest.bundle_id).toBe(f.meeting.id);
    expect((manifest.decisions as unknown[]).length).toBe(3);
    expect((manifest.excluded_from_bundle as unknown[]).length).toBe(1);
  });

  it('manifest mtime AFTER all seed mtimes (commit-point invariant)', async () => {
    const { f } = setupBundleScenario();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitBundle(f.meeting.id);

    const manifestMtime = statSync(result.manifest_path).mtimeMs;
    for (const e of result.emissions) {
      const mdMtime = statSync(e.vision_doc_path).mtimeMs;
      expect(manifestMtime).toBeGreaterThanOrEqual(mdMtime - 5);
    }
  });

  it('latency: 3-decision bundle <500 ms (P6)', async () => {
    const { f } = setupBundleScenario();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const t0 = performance.now();
    await emitter.emitBundle(f.meeting.id);
    const t1 = performance.now();
    expect(t1 - t0).toBeLessThan(500);
  });

  it('pre-emission validation failure → no files written (D-25-14)', async () => {
    const { f, bundled } = setupBundleScenario();
    // Corrupt one decision's meta to fail validation: invalid finding ID format
    // (must match /^F-/). Replace its source_findings with a malformed entry.
    const corrupt = makeDecision({
      ...bundled[0],
      source_findings: ['not-an-F-id'] as never,
    });
    f.kb._state.decisions.set(bundled[0].id, corrupt);
    f.kb._state.findings.set(
      'not-an-F-id',
      makeFinding({
        id: 'not-an-F-id' as never,
        rationale: 'malformed finding id for test',
      }),
    );
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await expect(emitter.emitBundle(f.meeting.id)).rejects.toThrow(/validation/);

    // Verify no files were written.
    const inbox = join(stagingRoot, 'staging', 'inbox');
    if (existsSync(inbox)) {
      const files = readdirSync(inbox);
      expect(files.filter((f) => f.endsWith('.md')).length).toBe(0);
    }
  });

  it('no bundled decisions → throws descriptive error', async () => {
    const f = buildPopulatedKB();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    // Original mock has 1 pending decision; emitBundle requires 'bundled'
    await expect(emitter.emitBundle(f.meeting.id)).rejects.toThrow(/no bundled/);
  });

  it('per-decision markEmitted + addMissionLink calls land', async () => {
    const { f } = setupBundleScenario();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    await emitter.emitBundle(f.meeting.id);

    expect(f.kb._state.markEmittedCalls.length).toBe(3);
    expect(f.kb._state.missionLinkCalls.length).toBe(3);
    for (const call of f.kb._state.missionLinkCalls) {
      expect(call.kind).toBe('vision_seed');
      expect(call.ref).toContain('.md');
    }
  });

  it('sent_now decision is recorded in excluded_from_bundle', async () => {
    const { f } = setupBundleScenario();
    const emitter = new MissionEmitter({ kb: f.kb, stagingRoot });
    const result = await emitter.emitBundle(f.meeting.id);
    const manifestText = readFileSync(result.manifest_path, 'utf8');
    const manifest = yaml.load(manifestText) as {
      excluded_from_bundle: Array<{ reason: string; title: string }>;
    };
    expect(manifest.excluded_from_bundle.length).toBe(1);
    expect(manifest.excluded_from_bundle[0].reason).toBe('sent_now');
    expect(manifest.excluded_from_bundle[0].title).toBe('Already sent');
  });
});
