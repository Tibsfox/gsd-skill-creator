/**
 * MA-2 ACE — loop.test.ts
 *
 * SC-MA2-01 byte-identical flag-off fixture: captures M5 selector scoring
 * across 50 synthetic observations; flag-on-with-all-zero-signals and
 * flag-off must produce identical scoring output.
 *
 * @module ace/__tests__/loop.test
 */

import { describe, it, expect } from 'vitest';
import { AceLoop, runAceLoop } from '../loop.js';
import { ActivationSelector, type Candidate } from '../../orchestration/selector.js';
import { ActivationWriter } from '../../traces/activation-writer.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

function tempWriter(): ActivationWriter {
  const p = join(tmpdir(), `ace-loop-test-${randomUUID()}`, 'traces.jsonl');
  return new ActivationWriter(p);
}

describe('AceLoop — flag semantics', () => {
  it('flag-off: tick() returns null and does not mutate state', () => {
    const loop = new AceLoop({ enabledOverride: false });
    const r = loop.tick({ readings: [], negFCurr: 1.0 });
    expect(r).toBeNull();
    expect(loop.currentTick).toBe(0);
    expect(loop.criticRef.estimate).toBe(0);
  });

  it('flag-on: tick() returns signal and advances tick counter', () => {
    const loop = new AceLoop({ enabledOverride: true });
    const r = loop.tick({ readings: [], negFCurr: 1.0 });
    expect(r).not.toBeNull();
    expect(r!.tick).toBe(1);
    expect(loop.currentTick).toBe(1);
  });

  it('setEnabled toggles the flag at runtime', () => {
    const loop = new AceLoop({ enabledOverride: false });
    expect(loop.isEnabled()).toBe(false);
    loop.setEnabled(true);
    expect(loop.isEnabled()).toBe(true);
    const r = loop.tick({ readings: [], negFCurr: 0.5 });
    expect(r).not.toBeNull();
  });

  it('tracks ΔF across ticks: second tick uses first tick negF as prev', () => {
    const loop = new AceLoop({
      enabledOverride: true,
      tdOptions: { gamma: 0.95, tractabilityClass: 'tractable' },
    });
    const t1 = loop.tick({ readings: [], negFCurr: 1.0 });
    // After t1, prevNegF = 1.0. At t2 we expect raw δ = 0 + 0.95*2.0 - 1.0 = 0.9
    const t2 = loop.tick({ readings: [], negFCurr: 2.0 });
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
    expect(t2!.delta).toBeCloseTo(0.9, 12);
  });

  it('reset() clears counter and critic but preserves flag', () => {
    const loop = new AceLoop({ enabledOverride: true });
    loop.tick({ readings: [], negFCurr: 1.0 });
    loop.tick({ readings: [], negFCurr: 2.0 });
    expect(loop.currentTick).toBe(2);
    loop.reset();
    expect(loop.currentTick).toBe(0);
    expect(loop.criticRef.estimate).toBe(0);
    expect(loop.isEnabled()).toBe(true);
  });
});

describe('runAceLoop', () => {
  it('returns a result per input; nulls throughout when disabled', () => {
    const out = runAceLoop(
      [
        { readings: [], negFCurr: 1 },
        { readings: [], negFCurr: 2 },
      ],
      { enabledOverride: false },
    );
    expect(out.length).toBe(2);
    expect(out.every((r) => r === null)).toBe(true);
  });

  it('emits signals on every tick when enabled', () => {
    const out = runAceLoop(
      [
        { readings: [], negFCurr: 1 },
        { readings: [], negFCurr: 2 },
        { readings: [], negFCurr: 3 },
      ],
      { enabledOverride: true, tdOptions: { tractabilityClass: 'tractable' } },
    );
    expect(out.every((r) => r !== null)).toBe(true);
    expect(out.map((r) => r!.tick)).toEqual([1, 2, 3]);
  });
});

// -----------------------------------------------------------------------------
// SC-MA2-01: byte-identical flag-off fixture
// -----------------------------------------------------------------------------

async function runSelectorFixture(
  withAce: boolean,
  allZeroSignals: boolean,
): Promise<Array<{ id: string; score: number; activated: boolean }>> {
  // 50 synthetic observations, deterministic candidate pool.
  const now = 1_700_000_000_000;
  const candidates: Candidate[] = [];
  for (let i = 0; i < 5; i++) {
    candidates.push({
      id: `skill-${i}`,
      content: `task word-${i} query terms`,
      ts: now,
      importance: (i + 1) * 0.1,
    });
  }

  const out: Array<{ id: string; score: number; activated: boolean }> = [];
  const loop = new AceLoop({
    enabledOverride: withAce,
    tdOptions: { tractabilityClass: 'tractable' },
  });

  for (let obs = 0; obs < 50; obs++) {
    const selector = new ActivationSelector({
      writer: tempWriter(),
      fireAndForgetTrace: true,
    });
    // Feed the loop; when all-zero-signals, readings/negF stay zeros so δ=0.
    const negF = allZeroSignals ? 0 : (obs + 1) * 0.01;
    const tick = loop.tick({ readings: [], negFCurr: negF });
    const context =
      withAce && tick !== null ? { aceSignal: tick.signal } : {};
    const query = 'query terms';
    const decisions = await selector.select(query, candidates, context);
    for (const d of decisions) {
      out.push({ id: d.id, score: d.score, activated: d.activated });
    }
  }
  return out;
}

describe('SC-MA2-01 — flag-off byte-identical fixture', () => {
  it('flag-off produces identical scoring to flag-on-with-all-zero-signals', async () => {
    const flagOff = await runSelectorFixture(false, true);
    const flagOnZero = await runSelectorFixture(true, true);
    expect(flagOnZero.length).toBe(flagOff.length);
    for (let i = 0; i < flagOff.length; i++) {
      expect(flagOnZero[i].id).toBe(flagOff[i].id);
      expect(flagOnZero[i].score).toBe(flagOff[i].score);
      expect(flagOnZero[i].activated).toBe(flagOff[i].activated);
    }
  });

  it('flag-off scoring is also byte-identical when selector is called without any ACE context', async () => {
    // Sanity: baseline twice → identical (determinism of the no-ACE path).
    const a = await runSelectorFixture(false, true);
    const b = await runSelectorFixture(false, true);
    expect(a).toEqual(b);
  });
});
